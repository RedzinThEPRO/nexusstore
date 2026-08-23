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

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error("Invalid server environment configuration: " + fields);
}
export const env = parsed.data;
export const allowedOrigins = env.FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean);
