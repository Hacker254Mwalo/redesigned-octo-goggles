import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSupabaseIdentity, type SupabaseIdentity } from "../supabase-auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  supabaseIdentity: SupabaseIdentity | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let supabaseIdentity: SupabaseIdentity | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  if (!user) supabaseIdentity = await getSupabaseIdentity(opts.req.headers);

  return {
    req: opts.req,
    res: opts.res,
    user,
    supabaseIdentity,
  };
}
