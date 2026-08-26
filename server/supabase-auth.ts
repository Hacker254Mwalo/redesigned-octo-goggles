import type { IncomingHttpHeaders } from "node:http";
import { verifySupabaseAccessToken } from "./supabase";

export type SupabaseIdentity = {
  subject: string;
  email: string | null;
  issuedAt: number | null;
};

export function extractSupabaseBearerToken(authorization: string | string[] | undefined) {
  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function getSupabaseIdentity(headers: IncomingHttpHeaders): Promise<SupabaseIdentity | null> {
  const token = extractSupabaseBearerToken(headers.authorization);
  if (!token) return null;
  try {
    const payload = await verifySupabaseAccessToken(token);
    return {
      subject: String(payload.sub),
      email: typeof payload.email === "string" ? payload.email : null,
      issuedAt: typeof payload.iat === "number" ? payload.iat : null,
    };
  } catch {
    return null;
  }
}
