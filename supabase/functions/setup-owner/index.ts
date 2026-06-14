// Paste this ENTIRE file into Supabase Dashboard → Edge Functions → setup-owner
// Endpoint: {VITE_SUPABASE_URL}/functions/v1/setup-owner — JWT: OFF
// Local app: http://localhost:5173/setup — All links: supabase/functions/LINKS.md
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

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    if (req.method === "GET") {
      const { count } = await admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "owner");

      return jsonResponse({ ownerExists: (count ?? 0) > 0 });
    }

    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return jsonResponse({ error: "fullName, email, and password are required" }, 400);
    }

    const { count } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner");

    if ((count ?? 0) > 0) {
      return jsonResponse({ error: "Owner already exists" }, 400);
    }

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) return jsonResponse({ error: authError.message }, 400);

    const { error: profileError } = await admin.from("profiles").insert({
      id: authUser.user.id,
      full_name: fullName,
      email,
      role: "owner",
    });

    if (profileError) return jsonResponse({ error: profileError.message }, 400);

    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
