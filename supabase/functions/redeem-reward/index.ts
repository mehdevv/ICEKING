// Paste this ENTIRE file into Supabase Dashboard → Edge Functions → redeem-reward
// Endpoint: {VITE_SUPABASE_URL}/functions/v1/redeem-reward — JWT: ON
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

function extractRewardId(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("reward:")) {
    const id = trimmed.slice(7).trim();
    return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  }
  if (/^[0-9a-f-]{36}$/i.test(trimmed)) return trimmed;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { data: worker } = await supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", user.id)
      .single();

    if (!worker || worker.role !== "worker" || !worker.is_active) {
      return jsonResponse({ error: "Worker not authorized" }, 403);
    }

    const body = await req.json();
    const rewardId = extractRewardId(String(body.rewardQrToken ?? body.rewardId ?? ""));

    if (!rewardId) {
      return jsonResponse({ error: "Invalid reward QR code" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: reward } = await admin
      .from("rewards")
      .select("id, reward_description, redeemed_at, client_id, clients(full_name, is_blocked)")
      .eq("id", rewardId)
      .maybeSingle();

    if (!reward) {
      return jsonResponse({ error: "Reward not found" }, 404);
    }

    const client = reward.clients as { full_name?: string; is_blocked?: boolean } | null;
    if (!client || client.is_blocked) {
      return jsonResponse({ error: "Client not found" }, 404);
    }

    if (reward.redeemed_at) {
      return jsonResponse({
        approved: false,
        reason: "already_redeemed",
        clientName: client.full_name ?? null,
        rewardDescription: reward.reward_description,
        redeemedAt: reward.redeemed_at,
      });
    }

    const redeemedAt = new Date().toISOString();
    const { error: updateError } = await admin
      .from("rewards")
      .update({
        redeemed_at: redeemedAt,
        redeemed_by_worker_id: worker.id,
      })
      .eq("id", rewardId);

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }

    return jsonResponse({
      approved: true,
      reason: null,
      clientName: client.full_name ?? null,
      rewardDescription: reward.reward_description,
      redeemedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Redeem failed";
    return jsonResponse({ error: message }, 500);
  }
});
