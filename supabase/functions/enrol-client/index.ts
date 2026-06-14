// Paste this ENTIRE file into Supabase Dashboard → Edge Functions → enrol-client
// Endpoint: {VITE_SUPABASE_URL}/functions/v1/enrol-client — JWT: OFF
// Local app: http://localhost:5173/client — All links: supabase/functions/LINKS.md
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { fullName, phone, email } = await req.json();

    if (!fullName || typeof fullName !== "string") {
      return jsonResponse({ error: "fullName is required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = crypto.randomUUID();
    const { data: client, error } = await admin
      .from("clients")
      .insert({
        full_name: fullName,
        phone: phone ?? null,
        email: email ?? null,
        fidelity_qr_token: token,
      })
      .select("fidelity_qr_token")
      .single();

    if (error) return jsonResponse({ error: error.message }, 400);

    return jsonResponse({ fidelityQrToken: client.fidelity_qr_token });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
