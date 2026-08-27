export type ReadinessState = "ready" | "blocked" | "intentional";

export type ProductionGate = {
  id: "database" | "publicDiscovery" | "server" | "auth" | "storage" | "commerce";
  title: string;
  state: ReadinessState;
  detail: string;
  nextAction: string;
};

export type ProductionReadiness = {
  projectRef: string;
  overallState: "foundation_ready" | "protected_runtime_blocked";
  readyCount: number;
  blockedCount: number;
  gates: ProductionGate[];
};

export const MTAA_SUPABASE_PROJECT_REF = "mfgjpjtlmfdtsnkoluco";

/**
 * Reports only safe deployment facts. It deliberately never returns secrets,
 * URLs, account identifiers, customer data, or payment configuration.
 */
export function getProductionReadiness(): ProductionReadiness {
  const gates: ProductionGate[] = [
    {
      id: "database",
      title: "Isolated PostgreSQL foundation",
      state: "ready",
      detail: "MtaaMarket has its own Supabase project with marketplace tables, Row Level Security, storage buckets, and Siaya categories.",
      nextAction: "Keep Dumiropay completely separate.",
    },
    {
      id: "server",
      title: "V3 protected server control plane",
      state: "ready",
      detail: "V3 identity, vendor, listing, moderation, and controlled hub-order procedures use server-verified Supabase UUIDs. Legacy MySQL/TiDB procedures remain isolated from V3 customer routes.",
      nextAction: "Keep new protected marketplace features on the V3 Supabase path; retire legacy procedures only through a separate migration review.",
    },
    {
      id: "publicDiscovery",
      title: "Public catalogue discovery",
      state: "ready",
      detail: "Vercel-compatible Supabase reads serve the MtaaMarket taxonomy and only ACTIVE V3 product records. The empty state is intentional until owner-reviewed original listings exist.",
      nextAction: "Add only original, rights-cleared listings through the protected PENDING-to-owner-review path.",
    },
    {
      id: "auth",
      title: "Supabase password accounts and owner gate",
      state: "ready",
      detail: "Password-first Supabase accounts, code-only signup and recovery verification, server JWKS validation, UUID-bound buyer profiles, and founder-email-only owner bootstrap are implemented.",
      nextAction: "The configured founder must complete the deliberately controlled browser sign-in and owner-activation test before performing owner operations.",
    },
    {
      id: "storage",
      title: "Production product-media uploads",
      state: "blocked",
      detail: "The server-only adapter has verified isolated public original-media upload/cleanup and private signed-URL handling, but no founder-controlled authenticated Vercel listing upload has been performed.",
      nextAction: "After founder owner activation and approved-vendor setup, run one controlled deployed listing upload and record only pass/fail evidence.",
    },
    {
      id: "commerce",
      title: "Payments, courier, and assisted sourcing",
      state: "intentional",
      detail: "External payments, couriers, and supplier ordering stay deliberately manual until a real provider decision and workflow approval exist.",
      nextAction: "Use Request Desk and owner-managed Assisted Market orders; do not enable checkout automation or supplier bots.",
    },
  ];

  const readyCount = gates.filter(gate => gate.state === "ready").length;
  const blockedCount = gates.filter(gate => gate.state === "blocked").length;

  return {
    projectRef: MTAA_SUPABASE_PROJECT_REF,
    overallState: blockedCount === 0 ? "foundation_ready" : "protected_runtime_blocked",
    readyCount,
    blockedCount,
    gates,
  };
}
