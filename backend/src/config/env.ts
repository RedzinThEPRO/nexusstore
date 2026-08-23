import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(10000),
  FRONTEND_URL: z.string().min(1),
  BACKEND_PUBLIC_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  EVOPAY_API_KEY: z.string().min(1),
});

console.log("[env-diagnostic]", { TEST_VARIABLE: process.env.TEST_VARIABLE, FRONTEND_URL: Boolean(process.env.FRONTEND_URL), BACKEND_PUBLIC_URL: Boolean(process.env.BACKEND_PUBLIC_URL), SUPABASE_URL: Boolean(process.env.SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), EVOPAY_API_KEY: Boolean(process.env.EVOPAY_API_KEY), PORT: Boolean(process.env.PORT), });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error("Invalid server environment configuration: " + fields);
}
export const env = parsed.data;
export const allowedOrigins = env.FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean);
