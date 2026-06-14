import { useMutation, useQuery } from "@tanstack/react-query";
import { invokeFunction, supabase } from "@/lib/supabase";
import { mapClient } from "./mappers";
import type { Client, ClientCard } from "./types";
import { mapSettings } from "./mappers";

export const getListClientsQueryKey = (params?: Record<string, unknown>) =>
  ["clients", params] as const;

export function useListClients(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  return useQuery({
    queryKey: getListClientsQueryKey(params),
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*", { count: "exact" })
        .order("enrolled_at", { ascending: false });

      if (params?.search) {
        const s = `%${params.search}%`;
        query = query.or(`full_name.ilike.${s},phone.ilike.${s},email.ilike.${s}`);
      }
      if (params?.status === "active") query = query.eq("is_blocked", false);
      if (params?.status === "blocked") query = query.eq("is_blocked", true);

      const from = (page - 1) * limit;
      const { data, count, error } = await query.range(from, from + limit - 1);
      if (error) throw error;

      return {
        clients: (data ?? []).map((r) => mapClient(r)),
        total: count ?? 0,
        page,
        totalPages: Math.ceil((count ?? 0) / limit),
      };
    },
  });
}

export function useGetClient(id?: string) {
  return useQuery({
    queryKey: ["client", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;

      const { data: scans } = await supabase
        .from("scan_logs")
        .select("*, profiles:worker_id(full_name)")
        .eq("client_id", id!)
        .order("scanned_at", { ascending: false })
        .limit(50);

      const { data: rewards } = await supabase
        .from("rewards")
        .select("*")
        .eq("client_id", id!)
        .order("created_at", { ascending: false });

      const { data: settings } = await supabase
        .from("shop_settings")
        .select("stamp_threshold")
        .limit(1)
        .single();

      return {
        client: mapClient(client),
        stampThreshold: settings?.stamp_threshold ?? 9,
        scans: (scans ?? []).map((s) => ({
          id: s.id,
          scannedAt: s.scanned_at,
          status: s.status,
          stampsAdded: s.stamps_added,
          workerName: (s.profiles as { full_name?: string } | null)?.full_name ?? null,
          rewardTriggered: s.reward_triggered,
        })),
        rewards: (rewards ?? []).map((r) => ({
          id: r.id,
          rewardDescription: r.reward_description,
          createdAt: r.created_at,
          redeemedAt: r.redeemed_at,
        })),
      };
    },
  });
}

export function useUpdateClient() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const payload: Record<string, unknown> = {};
      if (data.notes !== undefined) payload.notes = data.notes;
      if (data.isBlocked !== undefined) payload.is_blocked = data.isBlocked;

      const { error } = await supabase.from("clients").update(payload).eq("id", id);
      if (error) throw error;
    },
  });
}

export function useDeleteClient() {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("clients")
        .update({
          full_name: "Anonymised",
          phone: null,
          email: null,
          notes: null,
          is_blocked: true,
        })
        .eq("id", id);
      if (error) throw error;
    },
  });
}

export function useEnrolClient() {
  return useMutation({
    mutationFn: async ({ data }: { data: { fullName: string; phone?: string; email?: string } }) => {
      return invokeFunction<{ fidelityQrToken: string }>("enrol-client", data);
    },
  });
}

export function useGetClientCard(token: string, options?: { query?: { enabled?: boolean } }) {
  return useQuery({
    queryKey: ["client-card", token],
    enabled: (options?.query?.enabled ?? true) && !!token,
    queryFn: async (): Promise<ClientCard> => {
      const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("fidelity_qr_token", token)
        .single();
      if (error) throw error;

      const { data: settings } = await supabase
        .from("shop_settings")
        .select("*")
        .limit(1)
        .single();

      const { data: pendingReward } = await supabase
        .from("rewards")
        .select("id, reward_description")
        .eq("client_id", client.id)
        .is("redeemed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: recentScans } = await supabase
        .from("scan_logs")
        .select("scanned_at, status, stamps_added")
        .eq("client_id", client.id)
        .order("scanned_at", { ascending: false })
        .limit(5);

      const s = settings ? mapSettings(settings) : null;

      return {
        businessName: s?.businessName ?? "LoyalQR",
        clientName: client.full_name,
        primaryColor: s?.primaryColor ?? "#1A56DB",
        cardUrl: client.card_url,
        cardTemplateUrl: s?.cardTemplateUrl ?? "/card-bg.png",
        stampThreshold: s?.stampThreshold ?? 9,
        currentCycleStamps: client.current_cycle_stamps,
        fidelityQrToken: client.fidelity_qr_token,
        pendingRewardId: pendingReward?.id ?? null,
        pendingRewardDescription: pendingReward?.reward_description ?? null,
        recentScans: (recentScans ?? []).map((scan) => ({
          scannedAt: scan.scanned_at,
          status: scan.status,
          stampsAdded: scan.stamps_added,
        })),
      };
    },
  });
}

export async function exportContactsCsv(): Promise<Blob> {
  const { data, error } = await supabase
    .from("clients")
    .select("full_name, phone, email, total_stamps, enrolled_at, is_blocked")
    .order("full_name");
  if (error) throw error;

  const header = "Name,Phone,Email,Stamps,Enrolled,Status\n";
  const rows = (data ?? [])
    .map((c) =>
      [
        `"${(c.full_name ?? "").replace(/"/g, '""')}"`,
        c.phone ?? "",
        c.email ?? "",
        c.total_stamps,
        c.enrolled_at,
        c.is_blocked ? "blocked" : "active",
      ].join(","),
    )
    .join("\n");

  return new Blob([header + rows], { type: "text/csv" });
}

export type { Client };
