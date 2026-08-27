import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { COOKIE_NAME } from "@shared/const";
import { decodeProtectedHeader } from "jose";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSupabaseIdentity, type SupabaseIdentity } from "../supabase-auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  supabaseIdentity: SupabaseIdentity | null;
};

function hasLegacySessionCredential(req: CreateExpressContextOptions["req"]) {
  const cookieHeader = req.headers.cookie || "";
  if (cookieHeader.split(";").some(cookie => cookie.trim().startsWith(`${COOKIE_NAME}=`))) return true;

  const authorization = req.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return false;

  try {
    return decodeProtectedHeader(authorization.slice(7)).alg === "HS256";
  } catch {
    // Preserve the legacy fallback for malformed bearer credentials so protected routes still reject them normally.
    return true;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let supabaseIdentity: SupabaseIdentity | null = null;

  if (hasLegacySessionCredential(opts.req)) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  if (!user) supabaseIdentity = await getSupabaseIdentity(opts.req.headers);

  return {
    req: opts.req,
    res: opts.res,
    user,
    supabaseIdentity,
  };
}
