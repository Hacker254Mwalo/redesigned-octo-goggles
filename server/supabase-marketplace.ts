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

type SupabasePublicProductRow = {
  id: string;
  vendor_id: string | null;
  title: string;
  description: string | null;
  image_url: string;
  base_price: string | number;
  final_price: string | number;
  is_admin_concierge: boolean;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  allow_pay_on_pickup: boolean;
  created_at: string;
};

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function mapSupabasePublicProduct(row: SupabasePublicProductRow) {
  const category: PublicMarketplaceCategory = {
    id: "v3-general-goods",
    name: "General goods",
    slug: "general-goods",
    icon: "Package",
    description: "Owner-reviewed physical products for Siaya buyers.",
    sortOrder: 999,
    isActive: true,
    createdAt: new Date(row.created_at),
  };

  return {
    product: {
      id: row.id,
      vendorId: row.vendor_id,
      categoryId: category.id,
      title: row.title,
      slug: `v3-${row.id}`,
      description: row.description ?? "Owner-reviewed listing details are being prepared.",
      price: Number(row.final_price),
      stockQuantity: 0,
      imageUrl: row.image_url,
      imageKey: null,
      imageAlt: row.title,
      isLocalInventory: row.is_admin_concierge,
      sourceType: row.is_admin_concierge ? "mtaa_select" : "approved_seller",
      itemCondition: "new",
      availabilityStatus: "seller_confirmed",
      paymentTiming: row.allow_pay_on_pickup ? "pay_on_collection" : "confirm_with_mtaamarket",
      fulfilmentOptions: row.allow_pay_on_pickup ? ["siaya_pickup"] : [],
      moderationStatus: "visible",
      status: row.status === "ACTIVE" ? "active" : "draft",
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
    },
    category,
    vendor: null,
  };
}

export function mapOptionalSupabasePublicProduct(row: SupabasePublicProductRow | null) {
  return row ? mapSupabasePublicProduct(row) : null;
}

const PUBLIC_PRODUCT_SELECT = "id,vendor_id,title,description,image_url,base_price,final_price,is_admin_concierge,status,allow_pay_on_pickup,created_at";

function safeSearchTerm(search?: string) {
  return search?.trim().replace(/[%,_()]/g, " ").replace(/\s+/g, " ").slice(0, 100) || undefined;
}

export async function listSupabasePublicProducts(input?: { categorySlug?: string; search?: string; limit?: number }) {
  if (!isSupabaseConfigured()) return null;
  const limit = Math.min(Math.max(input?.limit ?? 24, 1), 60);
  let query = getSupabaseServiceClient()
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("status", "active")
    .eq("moderation_status", "visible")
    .order("created_at", { ascending: false })
    .limit(limit);

  const search = safeSearchTerm(input?.search);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) throw new Error(`MtaaMarket products could not be read from Supabase: ${error.message}`);
  return (data as SupabasePublicProductRow[]).map(mapSupabasePublicProduct);
}

export async function getSupabasePublicProductBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const v3Id = slug.startsWith("v3-") ? slug.slice(3) : null;
  if (!v3Id) return null;
  const { data, error } = await getSupabaseServiceClient()
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("id", v3Id)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (error) throw new Error(`MtaaMarket product could not be read from Supabase: ${error.message}`);
  return mapOptionalSupabasePublicProduct(data as SupabasePublicProductRow | null);
}

type SupabasePickupStationRow = {
  id: string;
  name: string;
  slug: string;
  county: string;
  town: string;
  address: string;
  landmark: string | null;
  opening_hours: string | null;
  contact_phone: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  is_active: boolean;
  created_at: string;
};

export async function listSupabasePublicPickupStations() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabaseServiceClient()
    .from("pickup_stations")
    .select("id,name,slug,county,town,address,landmark,opening_hours,contact_phone,latitude,longitude,is_active,created_at")
    .eq("is_active", true)
    .eq("county", "Siaya")
    .order("town", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`MtaaMarket pickup stations could not be read from Supabase: ${error.message}`);
  return (data as SupabasePickupStationRow[]).map(station => ({
    id: station.id,
    name: station.name,
    slug: station.slug,
    county: station.county,
    town: station.town,
    address: station.address,
    landmark: station.landmark,
    openingHours: station.opening_hours,
    contactPhone: station.contact_phone,
    latitude: station.latitude === null ? null : Number(station.latitude),
    longitude: station.longitude === null ? null : Number(station.longitude),
    isActive: station.is_active,
    createdAt: new Date(station.created_at),
  }));
}

type SupabaseVendorRow = {
  id: string;
  profile_id: string;
  store_name: string;
  store_slug: string;
  description: string | null;
  support_phone: string | null;
  logo_url: string | null;
  pickup_notes: string | null;
  service_area: string;
  approval_status: "pending" | "approved" | "suspended" | "rejected";
  owner_notes: string | null;
  approved_at: string | null;
  suspended_at: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function listSupabaseApprovedVendors() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabaseServiceClient()
    .from("vendors")
    .select("id,profile_id,store_name,store_slug,description,support_phone,logo_url,pickup_notes,service_area,approval_status,owner_notes,approved_at,suspended_at,is_verified,is_active,created_at,updated_at")
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("approved_at", { ascending: false })
    .order("store_name", { ascending: true })
    .limit(18);
  if (error) throw new Error(`MtaaMarket sellers could not be read from Supabase: ${error.message}`);
  return (data as SupabaseVendorRow[]).map(vendor => ({
    id: vendor.id,
    profileId: vendor.profile_id,
    storeName: vendor.store_name,
    storeSlug: vendor.store_slug,
    description: vendor.description,
    supportPhone: vendor.support_phone,
    logoUrl: vendor.logo_url,
    pickupNotes: vendor.pickup_notes,
    serviceArea: vendor.service_area,
    approvalStatus: vendor.approval_status,
    ownerNotes: vendor.owner_notes,
    approvedAt: vendor.approved_at ? new Date(vendor.approved_at) : null,
    suspendedAt: vendor.suspended_at ? new Date(vendor.suspended_at) : null,
    isVerified: vendor.is_verified,
    isActive: vendor.is_active,
    createdAt: new Date(vendor.created_at),
    updatedAt: new Date(vendor.updated_at),
  }));
}

type SupabaseReviewRow = {
  id: string;
  product_id: string;
  buyer_profile_id: string;
  order_item_id: string;
  rating: number;
  comment: string | null;
  image_url: string | null;
  created_at: string;
  marketplace_profiles: { id: string; display_name: string; role: "buyer" | "vendor" | "admin"; avatar_url: string | null } | Array<{ id: string; display_name: string; role: "buyer" | "vendor" | "admin"; avatar_url: string | null }> | null;
};

export async function listSupabaseVerifiedReviewsForProduct(productId: string) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabaseServiceClient()
    .from("reviews")
    .select("id,product_id,buyer_profile_id,order_item_id,rating,comment,image_url,created_at,marketplace_profiles!inner(id,display_name,role,avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`MtaaMarket reviews could not be read from Supabase: ${error.message}`);
  return (data as SupabaseReviewRow[]).map(row => {
    const reviewer = first(row.marketplace_profiles);
    if (!reviewer) throw new Error("Verified review is missing its marketplace profile.");
    return {
      review: {
        id: row.id,
        productId: row.product_id,
        buyerProfileId: row.buyer_profile_id,
        orderItemId: row.order_item_id,
        rating: row.rating,
        comment: row.comment,
        imageUrl: row.image_url,
        createdAt: new Date(row.created_at),
      },
      reviewer: {
        id: reviewer.id,
        displayName: reviewer.display_name,
        role: reviewer.role,
        avatarUrl: reviewer.avatar_url,
      },
    };
  });
}
