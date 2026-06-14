import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { mapSettings, snakeCaseKeys } from "./mappers";
import type { ShopSettings } from "./types";

export const getGetSettingsQueryKey = () => ["settings"] as const;

export function useGetSettings() {
  return useQuery({
    queryKey: getGetSettingsQueryKey(),
    queryFn: async (): Promise<ShopSettings> => {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return mapSettings(data);
    },
  });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const payload = snakeCaseKeys(data);
      const { error } = await supabase
        .from("shop_settings")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
  });
}
