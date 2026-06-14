import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { mapProduct } from "./mappers";

export const getListProductsQueryKey = () => ["products"] as const;

export function useListProducts() {
  return useQuery({
    queryKey: getListProductsQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((r) => mapProduct(r));
    },
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async ({ data }: { data: { name: string; sku?: string; category?: string; price: number } }) => {
      const { error } = await supabase.from("products").insert({
        name: data.name,
        sku: data.sku || null,
        category: data.category || null,
        price: data.price,
      });
      if (error) throw error;
    },
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.sku !== undefined) payload.sku = data.sku;
      if (data.category !== undefined) payload.category = data.category;
      if (data.price !== undefined) payload.price = data.price;
      if (data.isActive !== undefined) payload.is_active = data.isActive;

      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) throw error;
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
  });
}
