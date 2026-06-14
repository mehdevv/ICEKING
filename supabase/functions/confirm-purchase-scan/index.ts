// Paste this ENTIRE file into Supabase Dashboard → Edge Functions → confirm-purchase-scan
// Endpoint: {VITE_SUPABASE_URL}/functions/v1/confirm-purchase-scan — JWT: ON
// Local app: http://localhost:5173/worker — All links: supabase/functions/LINKS.md
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

    const { pendingScanId, products } = await req.json();
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: scan } = await admin
      .from("scan_logs")
      .select("*, clients(*)")
      .eq("id", pendingScanId)
      .single();

    if (!scan || !scan.pending_products) {
      return jsonResponse({ error: "Invalid pending scan" }, 400);
    }

    const scanRow = scan as { clients: Record<string, unknown> };
    const client = scanRow.clients;
    const { data: settings } = await admin.from("shop_settings").select("*").limit(1).single();
    const threshold = settings?.stamp_threshold ?? 9;

    for (const item of products ?? []) {
      await admin.from("scan_products").insert({
        scan_log_id: pendingScanId,
        product_id: item.productId,
        quantity: item.quantity ?? 1,
      });
    }

    const newCycleStamps = (client.current_cycle_stamps as number) + 1;
    let rewardTriggered = false;
    let rewardDescription: string | null = null;
    let finalCycleStamps = newCycleStamps;

    if (newCycleStamps >= threshold) {
      rewardTriggered = true;
      rewardDescription = settings?.reward_value || "Loyalty reward";
      finalCycleStamps = 0;
    }

    await admin
      .from("scan_logs")
      .update({
        pending_products: false,
        stamps_added: 1,
        reward_triggered: rewardTriggered,
      })
      .eq("id", pendingScanId);

    await admin
      .from("clients")
      .update({
        current_cycle_stamps: finalCycleStamps,
        total_stamps: (client.total_stamps as number) + 1,
        last_scan_at: new Date().toISOString(),
        total_rewards_earned: rewardTriggered
          ? (client.total_rewards_earned as number) + 1
          : client.total_rewards_earned,
      })
      .eq("id", client.id);

    if (rewardTriggered) {
      await admin.from("rewards").insert({
        client_id: client.id,
        scan_log_id: pendingScanId,
        reward_description: rewardDescription!,
      });
    }

    return jsonResponse({
      approved: true,
      reason: null,
      stampsAdded: 1,
      currentStamps: finalCycleStamps,
      stampThreshold: threshold,
      rewardTriggered,
      rewardDescription,
      needsProducts: false,
      clientName: client.full_name,
    });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
