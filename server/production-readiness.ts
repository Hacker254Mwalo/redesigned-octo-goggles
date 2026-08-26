export type ReadinessState = "ready" | "blocked" | "intentional";

export type ProductionGate = {
  id: "database" | "server" | "auth" | "storage" | "commerce";
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
      title: "Vercel data adapter",
      state: "blocked",
      detail: "The isolated Supabase client is configured and verified, but the running marketplace queries still use the existing MySQL/TiDB data adapter.",
      nextAction: "Port server queries and order procedures to the reviewed PostgreSQL schema, then test every protected flow.",
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
      detail: "The upload compatibility layer can use the isolated Supabase buckets, but Vercel environment configuration and end-to-end media tests are still required.",
      nextAction: "Set Vercel environment values securely and test public original-product photos plus private operational files.",
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
