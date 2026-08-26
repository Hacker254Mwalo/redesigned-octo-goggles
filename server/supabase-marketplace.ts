import { getSupabaseServiceClient, isSupabaseConfigured } from "./supabase";

type SupabaseCategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type PublicMarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
};

export function mapSupabaseCategory(row: SupabaseCategoryRow): PublicMarketplaceCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    description: row.description,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Reads the isolated PostgreSQL catalogue only when its server configuration is
 * complete. The service key stays inside this server module and is never sent
 * to a browser response.
 */
export async function listSupabasePublicCategories(): Promise<PublicMarketplaceCategory[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabaseServiceClient()
    .from("categories")
    .select("id,name,slug,icon,description,sort_order,is_active,created_at")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`MtaaMarket catalogue could not be read from Supabase: ${error.message}`);
  return (data as SupabaseCategoryRow[]).map(mapSupabaseCategory);
}
