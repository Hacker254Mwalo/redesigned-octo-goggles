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
      title: "Protected Vercel data adapter",
      state: "blocked",
      detail: "Anonymous discovery reads now use isolated Supabase. Account, vendor, order, administration, and payment procedures still use the old MySQL/TiDB adapter and are blocked on Vercel.",
      nextAction: "Port the identity-linked server queries and order procedures to the reviewed PostgreSQL schema, then test every protected flow.",
    },
    {
      id: "publicDiscovery",
      title: "Public catalogue discovery",
      state: "ready",
      detail: "Vercel-compatible Supabase reads now serve categories, visible products, approved sellers, active Siaya pickup stations, and verified reviews without relying on the legacy MySQL database.",
      nextAction: "Add only original, verified listings and operational locations after the protected UUID/Auth write path is complete.",
    },
    {
      id: "auth",
      title: "Production sign-in and owner roles",
      state: "blocked",
      detail: "A Supabase JWKS verifier is configured, but the current marketplace still depends on Manus OAuth rather than a completed Supabase Auth session flow.",
      nextAction: "Implement Supabase Auth sign-in/session handling and assign the founder owner role through the final secured flow.",
    },
    {
      id: "storage",
      title: "Production product-media uploads",
      state: "blocked",
      detail: "The isolated Supabase storage layer and Vercel environment configuration are ready, but a deployed seller upload and retrieval flow has not yet been validated with the final Auth/UUID write path.",
      nextAction: "After Auth and seller-write migration, test public original-product photos plus private operational files in the deployed environment.",
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
