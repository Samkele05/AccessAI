import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LearningRequest {
  action: "get_place" | "update_place" | "list_places" | "suggest_context" | "delete_place";
  placeId?: string;
  placeName?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  navigationNotes?: string;
  radius?: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
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

    const body: LearningRequest = await req.json();
    const { action, placeId, placeName, location, navigationNotes, radius } = body;

    if (action === "get_place") {
      if (!placeId && !placeName) {
        throw new Error("Place ID or name required");
      }

      let query = supabase
        .from("learned_environments")
        .select("*")
        .eq("user_id", user.id);

      if (placeId) {
        query = query.eq("id", placeId);
      } else if (placeName) {
        query = query.eq("place_name", placeName);
      }

      const { data: place, error: placeError } = await query.maybeSingle();

      if (placeError) throw placeError;

      if (!place) {
        return new Response(
          JSON.stringify({
            success: true,
            place: null,
            found: false,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: relatedScans } = await supabase
        .from("environment_scans")
        .select("*, scan_sessions(location_context)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const placeRelatedScans = relatedScans?.filter((scan: any) => {
        const scanLocation = scan.scan_sessions?.location_context;
        return scanLocation?.placeName === place.place_name;
      });

      return new Response(
        JSON.stringify({
          success: true,
          place,
          found: true,
          relatedScans: placeRelatedScans || [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "update_place") {
      if (!placeId) {
        throw new Error("Place ID required");
      }

      const updateData: any = {};
      if (navigationNotes !== undefined) {
        updateData.navigation_notes = navigationNotes;
      }

      const { data: updatedPlace, error: updateError } = await supabase
        .from("learned_environments")
        .update(updateData)
        .eq("id", placeId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          place: updatedPlace,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "list_places") {
      const { data: places, error: listError } = await supabase
        .from("learned_environments")
        .select("*")
        .eq("user_id", user.id)
        .order("visit_count", { ascending: false })
        .limit(50);

      if (listError) throw listError;

      return new Response(
        JSON.stringify({
          success: true,
          places: places || [],
          count: places?.length || 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "suggest_context") {
      if (!location?.latitude || !location?.longitude) {
        throw new Error("Location coordinates required");
      }

      const { data: allPlaces } = await supabase
        .from("learned_environments")
        .select("*")
        .eq("user_id", user.id);

      const searchRadius = radius || 100;
      const nearbyPlaces = allPlaces?.filter((place: any) => {
        if (!place.location?.latitude || !place.location?.longitude) {
          return false;
        }

        const distance = calculateDistance(
          location.latitude!,
          location.longitude!,
          place.location.latitude,
          place.location.longitude
        );

        return distance <= searchRadius;
      }).sort((a: any, b: any) => {
        const distA = calculateDistance(
          location.latitude!,
          location.longitude!,
          a.location.latitude,
          a.location.longitude
        );
        const distB = calculateDistance(
          location.latitude!,
          location.longitude!,
          b.location.latitude,
          b.location.longitude
        );
        return distA - distB;
      });

      const suggestedPlace = nearbyPlaces?.[0] || null;

      let contextualAdvice = "";
      if (suggestedPlace) {
        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (openaiKey) {
          try {
            const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openaiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                max_tokens: 150,
                messages: [
                  {
                    role: "system",
                    content: "You are an accessibility assistant. Provide brief, helpful contextual information about a familiar place.",
                  },
                  {
                    role: "user",
                    content: `The user has returned to "${suggestedPlace.place_name}". They've been here ${suggestedPlace.visit_count} times. Common objects here: ${JSON.stringify(suggestedPlace.common_objects?.slice(0, 5))}. Navigation notes: ${suggestedPlace.navigation_notes || "none"}. Provide a brief, friendly welcome message with any helpful context (2-3 sentences max).`,
                  },
                ],
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              contextualAdvice = aiData.choices[0]?.message?.content?.trim() || "";
            }
          } catch (error) {
            console.error("AI context generation failed:", error);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          suggestedPlace,
          nearbyPlaces: nearbyPlaces || [],
          contextualAdvice,
          isKnownLocation: !!suggestedPlace,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "delete_place") {
      if (!placeId) {
        throw new Error("Place ID required");
      }

      const { error: deleteError } = await supabase
        .from("learned_environments")
        .delete()
        .eq("id", placeId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({
          success: true,
          deleted: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Environment learning error:", error);
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
