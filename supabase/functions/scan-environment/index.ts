import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScanRequest {
  sessionId?: string;
  scanType: "photo" | "live_stream" | "document" | "sign" | "face" | "navigation";
  imageData: string;
  imageType?: string;
  locationContext?: {
    latitude?: number;
    longitude?: number;
    placeName?: string;
  };
  detailLevel?: "standard" | "detailed" | "quick";
  requestedInfo?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body: ScanRequest = await req.json();
    const { sessionId, scanType, imageData, imageType, locationContext, detailLevel, requestedInfo } = body;

    if (!imageData) {
      throw new Error("No image data provided");
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("accessibility_needs, reading_level")
      .eq("id", user.id)
      .maybeSingle();

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from("scan_sessions")
        .insert({
          user_id: user.id,
          session_type: scanType,
          location_context: locationContext || {},
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      activeSessionId = newSession.id;
    }

    const scanTypePrompts: Record<string, string> = {
      photo: "Describe this image comprehensively for someone who cannot see it. Include all visible objects, people, text, colors, spatial relationships, and actions. Be thorough and clear.",
      live_stream: "Describe what you see in real-time. Focus on immediate surroundings, obstacles, people, and any important visual information for navigation and safety.",
      document: "Extract and transcribe ALL text from this document in reading order. Preserve formatting. After the text, describe the document type, layout, and any non-text elements like images, charts, or logos.",
      sign: "Read all text on this sign clearly and in order. Then describe the sign's appearance, colors, symbols, and context (where it appears to be located and what it indicates).",
      face: "Describe the person in this image: approximate age, gender presentation, facial expression, emotion, what they're wearing, and any relevant visual details. Be respectful and objective.",
      navigation: "Analyze this scene for navigation. Identify: pathways, obstacles, hazards, doorways, steps, ramps, accessible routes, signage, and any important spatial information for safe movement.",
    };

    const accessibilityContext = profile?.accessibility_needs
      ? `User accessibility needs: ${JSON.stringify(profile.accessibility_needs)}. `
      : "";

    const detailPrompts = {
      quick: "Provide a concise summary focusing on the most important elements.",
      standard: "Provide a thorough description with key details.",
      detailed: "Provide an extremely detailed description covering every visible element, spatial relationships, colors, textures, emotions, and context.",
    };

    const basePrompt = scanTypePrompts[scanType] || scanTypePrompts.photo;
    const detailInstruction = detailPrompts[detailLevel || "standard"];
    const requestedInfoPrompt = requestedInfo?.length
      ? ` Pay special attention to: ${requestedInfo.join(", ")}.`
      : "";

    const fullPrompt = `${accessibilityContext}${basePrompt} ${detailInstruction}${requestedInfoPrompt}`;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const startTime = Date.now();

    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageType || "image/jpeg"};base64,${imageData}`,
                },
              },
              { type: "text", text: fullPrompt },
            ],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      const errorData = await visionResponse.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const visionData = await visionResponse.json();
    const aiDescription = visionData.choices[0]?.message?.content?.trim();

    if (!aiDescription) {
      throw new Error("Empty AI response");
    }

    const responseTime = Date.now() - startTime;

    const detectedObjects: any[] = [];
    const detectedText: any[] = [];
    const accessibilityAlerts: any[] = [];

    if (scanType === "navigation") {
      if (aiDescription.toLowerCase().includes("stairs") || aiDescription.toLowerCase().includes("steps")) {
        accessibilityAlerts.push({ type: "stairs", severity: "high", message: "Steps detected ahead" });
      }
      if (aiDescription.toLowerCase().includes("obstacle") || aiDescription.toLowerCase().includes("blocked")) {
        accessibilityAlerts.push({ type: "obstacle", severity: "medium", message: "Potential obstacle detected" });
      }
      if (aiDescription.toLowerCase().includes("ramp") || aiDescription.toLowerCase().includes("accessible")) {
        accessibilityAlerts.push({ type: "accessible_route", severity: "low", message: "Accessible route identified" });
      }
    }

    const { data: scanRecord, error: scanError } = await supabase
      .from("environment_scans")
      .insert({
        session_id: activeSessionId,
        user_id: user.id,
        scan_type: scanType,
        ai_description: aiDescription,
        detected_objects: detectedObjects,
        detected_text: detectedText,
        accessibility_alerts: accessibilityAlerts,
      })
      .select()
      .single();

    if (scanError) throw scanError;

    await supabase
      .from("scan_sessions")
      .update({
        total_interactions: supabase.rpc("increment_interactions", { session_id: activeSessionId }),
      })
      .eq("id", activeSessionId);

    const readingLevel = profile?.reading_level || "simple";
    const shouldSimplify = readingLevel === "eli5" || readingLevel === "simple";

    let simplifiedDescription = aiDescription;
    if (shouldSimplify && aiDescription.length > 200) {
      const simplifyPrompt =
        readingLevel === "eli5"
          ? "Rewrite this description in very simple words suitable for a 5-year-old. Use short sentences."
          : "Rewrite this in plain English. Be clear and direct, no jargon.";

      const simplifyResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 800,
          messages: [
            { role: "system", content: "You simplify text for accessibility. Return only the simplified text." },
            { role: "user", content: `${simplifyPrompt}\n\n${aiDescription}` },
          ],
        }),
      });

      if (simplifyResponse.ok) {
        const simplifyData = await simplifyResponse.json();
        simplifiedDescription = simplifyData.choices[0]?.message?.content?.trim() || aiDescription;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: activeSessionId,
        scanId: scanRecord.id,
        description: simplifiedDescription,
        fullDescription: aiDescription,
        detectedObjects,
        detectedText,
        accessibilityAlerts,
        responseTimeMs: responseTime,
        scanType,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Scan environment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
