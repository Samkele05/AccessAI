import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AssistantRequest {
  sessionId: string;
  message: string;
  contextType?: "environment_query" | "navigation" | "assistance" | "general" | "follow_up";
  recentScanId?: string;
  voiceMode?: boolean;
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

    const body: AssistantRequest = await req.json();
    const { sessionId, message, contextType, recentScanId, voiceMode } = body;

    if (!message?.trim()) {
      throw new Error("No message provided");
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const { data: session } = await supabase
      .from("scan_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!session) {
      throw new Error("Invalid session");
    }

    const { data: recentConversations } = await supabase
      .from("ai_conversations")
      .select("user_message, ai_response")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(5);

    let environmentContext = "";
    if (recentScanId) {
      const { data: scan } = await supabase
        .from("environment_scans")
        .select("ai_description, detected_objects, detected_text, accessibility_alerts")
        .eq("id", recentScanId)
        .maybeSingle();

      if (scan) {
        environmentContext = `\n\nCURRENT ENVIRONMENT:\n${scan.ai_description}`;
        if (scan.accessibility_alerts?.length > 0) {
          environmentContext += `\n\nACCESSIBILITY ALERTS: ${JSON.stringify(scan.accessibility_alerts)}`;
        }
      }
    } else {
      const { data: recentScans } = await supabase
        .from("environment_scans")
        .select("ai_description, scan_type")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentScans?.[0]) {
        environmentContext = `\n\nLAST SCANNED ENVIRONMENT (${recentScans[0].scan_type}):\n${recentScans[0].ai_description}`;
      }
    }

    const conversationHistory = recentConversations
      ?.map((conv) => `User: ${conv.user_message}\nAssistant: ${conv.ai_response}`)
      .reverse()
      .join("\n\n") || "";

    const accessibilityNeeds = profile?.accessibility_needs || [];
    const readingLevel = profile?.reading_level || "simple";
    const interactionMode = profile?.interaction_mode || "both";

    const systemContext = `You are AccessAI, an intelligent accessibility assistant helping someone navigate their environment and daily life.

USER PROFILE:
- Accessibility needs: ${JSON.stringify(accessibilityNeeds)}
- Reading level: ${readingLevel}
- Preferred interaction: ${interactionMode}
${profile?.display_name ? `- Name: ${profile.display_name}` : ""}

CONVERSATION STYLE:
- Be warm, encouraging, and respectful
- Use ${readingLevel === "eli5" ? "very simple language like talking to a 5-year-old" : readingLevel === "simple" ? "plain English, short sentences, no jargon" : readingLevel === "teen" ? "clear, conversational language" : "standard adult language"}
- ${voiceMode ? "Keep responses concise for voice output (2-3 sentences max)" : "Provide thorough responses"}
- Always prioritize safety and accessibility information
- If asked about the environment, reference the scanned scene
- Be proactive about identifying potential hazards or helpful information

CONTEXT TYPE: ${contextType || "general"}

${conversationHistory ? `RECENT CONVERSATION:\n${conversationHistory}\n` : ""}${environmentContext}

Respond naturally to the user's message. If they're asking about their surroundings, use the environment context. If they need navigation help, provide clear, safe directions. Always be helpful and supportive.`;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const startTime = Date.now();

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: voiceMode ? 200 : 800,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemContext },
          { role: "user", content: message },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const aiData = await aiResponse.json();
    const assistantResponse = aiData.choices[0]?.message?.content?.trim();

    if (!assistantResponse) {
      throw new Error("Empty AI response");
    }

    const responseTime = Date.now() - startTime;

    const { data: conversationRecord, error: convError } = await supabase
      .from("ai_conversations")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        user_message: message,
        ai_response: assistantResponse,
        context_type: contextType || "general",
        response_time_ms: responseTime,
      })
      .select()
      .single();

    if (convError) throw convError;

    await supabase
      .from("scan_sessions")
      .update({ total_interactions: session.total_interactions + 1 })
      .eq("id", sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        conversationId: conversationRecord.id,
        response: assistantResponse,
        responseTimeMs: responseTime,
        contextUsed: {
          hasEnvironmentContext: !!environmentContext,
          hasConversationHistory: !!conversationHistory,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("AI Assistant error:", error);
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
