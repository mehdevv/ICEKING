import { useMutation, useQuery } from "@tanstack/react-query";
import { invokeFunction, supabase } from "@/lib/supabase";
import type { Worker } from "./types";

export const getListWorkersQueryKey = () => ["workers"] as const;

export function useListWorkers() {
  return useQuery({
    queryKey: getListWorkersQueryKey(),
    queryFn: async (): Promise<Worker[]> => {
      const { data: workers, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, is_active, worker_qr_token")
        .eq("role", "worker")
        .order("full_name");

      if (error) throw error;

      const result: Worker[] = [];
      for (const w of workers ?? []) {
        const { count } = await supabase
          .from("scan_logs")
          .select("*", { count: "exact", head: true })
          .eq("worker_id", w.id)
          .eq("status", "approved");

        result.push({
          id: w.id,
          fullName: w.full_name,
          email: w.email,
          isActive: w.is_active,
          scanCount: count ?? 0,
          workerQrToken: w.worker_qr_token,
        });
      }

      return result;
    },
  });
}

export function useCreateWorker() {
  return useMutation({
    mutationFn: async ({ data }: { data: { fullName: string; email: string; password: string } }) => {
      await invokeFunction("create-worker", data);
    },
  });
}

export function useUpdateWorker() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const payload: Record<string, unknown> = {};
      if (data.isActive !== undefined) payload.is_active = data.isActive;
      if (data.fullName !== undefined) payload.full_name = data.fullName;

      const { error } = await supabase.from("profiles").update(payload).eq("id", id);
      if (error) throw error;
    },
  });
}

export function useDeleteWorker() {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
  });
}

export function useGetWorkerQr(workerId?: string | null) {
  return useQuery({
    queryKey: ["worker-qr", workerId],
    enabled: !!workerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("worker_qr_token")
        .eq("id", workerId!)
        .single();
      if (error) throw error;
      return { token: data.worker_qr_token as string };
    },
  });
}
