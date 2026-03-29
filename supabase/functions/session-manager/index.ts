import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SessionRequest {
  action: "create" | "end" | "get" | "list" | "get_history";
  sessionId?: string;
  sessionType?: "environment" | "document" | "object" | "navigation" | "general";
  locationContext?: {
    latitude?: number;
    longitude?: number;
    placeName?: string;
    placeType?: string;
  };
  limit?: number;
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

    const body: SessionRequest = await req.json();
    const { action, sessionId, sessionType, locationContext, limit } = body;

    if (action === "create") {
      if (!sessionType) {
        throw new Error("Session type required");
      }

      const { data: newSession, error: createError } = await supabase
        .from("scan_sessions")
        .insert({
          user_id: user.id,
          session_type: sessionType,
          location_context: locationContext || {},
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      return new Response(
        JSON.stringify({
          success: true,
          session: newSession,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "end") {
      if (!sessionId) {
        throw new Error("Session ID required");
      }

      const { data: session, error: fetchError } = await supabase
        .from("scan_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!session) {
        throw new Error("Session not found");
      }

      const { data: scans } = await supabase
        .from("environment_scans")
        .select("*")
        .eq("session_id", sessionId);

      const { data: conversations } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("session_id", sessionId);

      const sessionDuration = Date.now() - new Date(session.started_at).getTime();

      const { data: updatedSession, error: updateError } = await supabase
        .from("scan_sessions")
        .update({
          ended_at: new Date().toISOString(),
          total_interactions: (scans?.length || 0) + (conversations?.length || 0),
          metadata: {
            duration_ms: sessionDuration,
            scan_count: scans?.length || 0,
            conversation_count: conversations?.length || 0,
          },
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (session.location_context?.placeName) {
        const { data: existingPlace } = await supabase
          .from("learned_environments")
          .select("*")
          .eq("user_id", user.id)
          .eq("place_name", session.location_context.placeName)
          .maybeSingle();

        if (existingPlace) {
          await supabase
            .from("learned_environments")
            .update({
              visit_count: existingPlace.visit_count + 1,
              last_visited: new Date().toISOString(),
            })
            .eq("id", existingPlace.id);
        } else if (scans && scans.length > 0) {
          const commonObjects = scans
            .flatMap((scan) => scan.detected_objects || [])
            .slice(0, 20);

          await supabase
            .from("learned_environments")
            .insert({
              user_id: user.id,
              place_name: session.location_context.placeName,
              location: session.location_context,
              common_objects: commonObjects,
              visit_count: 1,
            });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: updatedSession,
          summary: {
            duration_ms: sessionDuration,
            scans: scans?.length || 0,
            conversations: conversations?.length || 0,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "get") {
      if (!sessionId) {
        throw new Error("Session ID required");
      }

      const { data: session, error: sessionError } = await supabase
        .from("scan_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error("Session not found");
      }

      const { data: scans } = await supabase
        .from("environment_scans")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      const { data: conversations } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      return new Response(
        JSON.stringify({
          success: true,
          session,
          scans: scans || [],
          conversations: conversations || [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "list") {
      const queryLimit = limit || 20;

      const { data: sessions, error: listError } = await supabase
        .from("scan_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(queryLimit);

      if (listError) throw listError;

      return new Response(
        JSON.stringify({
          success: true,
          sessions: sessions || [],
          count: sessions?.length || 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "get_history") {
      const queryLimit = limit || 50;

      const { data: recentScans } = await supabase
        .from("environment_scans")
        .select("*, scan_sessions(session_type, location_context)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(queryLimit);

      const { data: recentConversations } = await supabase
        .from("ai_conversations")
        .select("*, scan_sessions(session_type, location_context)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(queryLimit);

      const { data: learnedPlaces } = await supabase
        .from("learned_environments")
        .select("*")
        .eq("user_id", user.id)
        .order("visit_count", { ascending: false })
        .limit(10);

      return new Response(
        JSON.stringify({
          success: true,
          history: {
            recentScans: recentScans || [],
            recentConversations: recentConversations || [],
            learnedPlaces: learnedPlaces || [],
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Session manager error:", error);
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
