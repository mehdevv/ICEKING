import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AnalyticsOverview } from "./types";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function useGetAnalyticsOverview() {
  return useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async (): Promise<AnalyticsOverview> => {
      const today = startOfDay(new Date()).toISOString();
      const weekAgo = daysAgo(7).toISOString();
      const thirtyDaysAgo = daysAgo(30).toISOString();

      const { count: totalClients } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      const { count: newClientsThisWeek } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .gte("enrolled_at", weekAgo);

      const { count: scansToday } = await supabase
        .from("scan_logs")
        .select("*", { count: "exact", head: true })
        .gte("scanned_at", today)
        .eq("status", "approved");

      const { count: scansThisWeek } = await supabase
        .from("scan_logs")
        .select("*", { count: "exact", head: true })
        .gte("scanned_at", weekAgo)
        .eq("status", "approved");

      const { count: rewardsPending } = await supabase
        .from("rewards")
        .select("*", { count: "exact", head: true })
        .is("redeemed_at", null);

      const { count: fraudAlertsToday } = await supabase
        .from("scan_logs")
        .select("*", { count: "exact", head: true })
        .gte("scanned_at", today)
        .neq("status", "approved");

      const { count: activeWorkers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "worker")
        .eq("is_active", true);

      const { data: recentScans } = await supabase
        .from("scan_logs")
        .select("scanned_at")
        .gte("scanned_at", thirtyDaysAgo)
        .eq("status", "approved");

      const { data: recentEnrolments } = await supabase
        .from("clients")
        .select("enrolled_at")
        .gte("enrolled_at", thirtyDaysAgo);

      const dailyScansMap = new Map<string, number>();
      const dailyEnrolMap = new Map<string, number>();

      for (let i = 29; i >= 0; i--) {
        const d = daysAgo(i);
        const key = d.toISOString().slice(0, 10);
        dailyScansMap.set(key, 0);
        dailyEnrolMap.set(key, 0);
      }

      for (const s of recentScans ?? []) {
        const key = s.scanned_at.slice(0, 10);
        dailyScansMap.set(key, (dailyScansMap.get(key) ?? 0) + 1);
      }

      for (const e of recentEnrolments ?? []) {
        const key = e.enrolled_at.slice(0, 10);
        dailyEnrolMap.set(key, (dailyEnrolMap.get(key) ?? 0) + 1);
      }

      return {
        totalClients: totalClients ?? 0,
        newClientsThisWeek: newClientsThisWeek ?? 0,
        scansToday: scansToday ?? 0,
        scansThisWeek: scansThisWeek ?? 0,
        rewardsPending: rewardsPending ?? 0,
        fraudAlertsToday: fraudAlertsToday ?? 0,
        activeWorkers: activeWorkers ?? 0,
        dailyScans: Array.from(dailyScansMap.entries()).map(([date, count]) => ({ date, count })),
        dailyEnrolments: Array.from(dailyEnrolMap.entries()).map(([date, count]) => ({ date, count })),
      };
    },
  });
}

export function useGetAnalyticsSales(params?: { days?: number }) {
  const days = params?.days ?? 30;
  const since = daysAgo(days).toISOString();

  return useQuery({
    queryKey: ["analytics-sales", days],
    queryFn: async () => {
      const { data: scans } = await supabase
        .from("scan_logs")
        .select("id")
        .eq("status", "approved")
        .gte("scanned_at", since);

      const scanIds = (scans ?? []).map((s) => s.id);
      if (scanIds.length === 0) {
        return { totalRevenue: 0, totalUnitsSold: 0, topProducts: [] };
      }

      const { data: scanProducts } = await supabase
        .from("scan_products")
        .select("quantity, products(name, price)")
        .in("scan_log_id", scanIds);

      const productMap = new Map<string, { productName: string; unitsSold: number; revenue: number }>();
      let totalUnits = 0;
      let totalRevenue = 0;

      for (const sp of scanProducts ?? []) {
        const product = sp.products as { name: string; price: number } | null;
        if (!product) continue;
        const qty = sp.quantity ?? 1;
        const rev = qty * Number(product.price);
        totalUnits += qty;
        totalRevenue += rev;

        const existing = productMap.get(product.name) ?? { productName: product.name, unitsSold: 0, revenue: 0 };
        existing.unitsSold += qty;
        existing.revenue += rev;
        productMap.set(product.name, existing);
      }

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 10);

      return { totalRevenue, totalUnitsSold: totalUnits, topProducts };
    },
  });
}

export function useGetWorkersLeaderboard() {
  return useQuery({
    queryKey: ["workers-leaderboard"],
    queryFn: async () => {
      const { data: workers } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "worker");

      const result = [];
      for (const w of workers ?? []) {
        const { data: scans } = await supabase
          .from("scan_logs")
          .select("status, reward_triggered")
          .eq("worker_id", w.id);

        const totalScans = scans?.length ?? 0;
        const approvedScans = scans?.filter((s) => s.status === "approved").length ?? 0;
        const fraudFlags = scans?.filter((s) => s.status !== "approved").length ?? 0;
        const rewardsTriggered = scans?.filter((s) => s.reward_triggered).length ?? 0;

        result.push({
          workerId: w.id,
          workerName: w.full_name,
          totalScans,
          approvedScans,
          fraudFlags,
          rewardsTriggered,
        });
      }

      return result.sort((a, b) => b.totalScans - a.totalScans);
    },
  });
}

export function useGetClientsLeaderboard() {
  return useQuery({
    queryKey: ["clients-leaderboard"],
    queryFn: async () => {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, full_name, total_stamps, total_rewards_earned, last_scan_at")
        .order("total_stamps", { ascending: false })
        .limit(10);

      const topBuyers = (clients ?? []).map((c) => ({
        clientId: c.id,
        clientName: c.full_name,
        totalStamps: c.total_stamps,
        totalRewards: c.total_rewards_earned,
      }));

      const thirtyDaysAgo = daysAgo(30);
      const { data: allClients } = await supabase
        .from("clients")
        .select("id, full_name, last_scan_at")
        .eq("is_blocked", false);

      const churnRisk = (allClients ?? [])
        .filter((c) => !c.last_scan_at || new Date(c.last_scan_at) < thirtyDaysAgo)
        .map((c) => {
          const last = c.last_scan_at ? new Date(c.last_scan_at) : null;
          const daysSince = last
            ? Math.floor((Date.now() - last.getTime()) / 86400000)
            : 999;
          return {
            clientId: c.id,
            clientName: c.full_name,
            lastScanAt: c.last_scan_at,
            daysSinceLastScan: daysSince,
          };
        })
        .sort((a, b) => b.daysSinceLastScan - a.daysSinceLastScan)
        .slice(0, 10);

      return { topBuyers, churnRisk };
    },
  });
}
