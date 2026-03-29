import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProfileRequest {
  action: "get" | "update" | "initialize";
  profileData?: {
    displayName?: string;
    accessibilityNeeds?: string[];
    preferredVoice?: string;
    readingLevel?: string;
    interactionMode?: string;
  };
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

    const body: ProfileRequest = await req.json();
    const { action, profileData } = body;

    if (action === "get") {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            display_name: user.email?.split("@")[0] || "User",
            accessibility_needs: [],
            preferred_voice: "nova",
            reading_level: "simple",
            interaction_mode: "both",
          })
          .select()
          .single();

        if (createError) throw createError;

        return new Response(
          JSON.stringify({
            success: true,
            profile: newProfile,
            isNew: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          profile,
          isNew: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "update" || action === "initialize") {
      if (!profileData) {
        throw new Error("No profile data provided");
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (profileData.displayName !== undefined) {
        updateData.display_name = profileData.displayName;
      }
      if (profileData.accessibilityNeeds !== undefined) {
        updateData.accessibility_needs = profileData.accessibilityNeeds;
      }
      if (profileData.preferredVoice !== undefined) {
        updateData.preferred_voice = profileData.preferredVoice;
      }
      if (profileData.readingLevel !== undefined) {
        updateData.reading_level = profileData.readingLevel;
      }
      if (profileData.interactionMode !== undefined) {
        updateData.interaction_mode = profileData.interactionMode;
      }

      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { data: newProfile, error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            display_name: profileData.displayName || user.email?.split("@")[0] || "User",
            accessibility_needs: profileData.accessibilityNeeds || [],
            preferred_voice: profileData.preferredVoice || "nova",
            reading_level: profileData.readingLevel || "simple",
            interaction_mode: profileData.interactionMode || "both",
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return new Response(
          JSON.stringify({
            success: true,
            profile: newProfile,
            action: "created",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          profile: updatedProfile,
          action: "updated",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Accessibility profile error:", error);
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
