import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export type AuthenticatedRequest = Request & { userId?: string; userEmail?: string };
const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

export async function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Unauthorized" });
  req.userId = data.user.id; req.userEmail = data.user.email ?? undefined; next();
}
