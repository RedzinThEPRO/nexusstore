import express from "express";
import cors from "cors";
import { env, allowedOrigins } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { paymentsRouter } from "./routes/payments.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { reconciliationRouter } from "./routes/reconciliation.js";
console.log("ENV DIAGNOSTIC:", {
  FRONTEND_URL: process.env.FRONTEND_URL !== undefined,
  BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL !== undefined,
  SUPABASE_URL: process.env.SUPABASE_URL !== undefined,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY !== undefined,
  EVOPAY_API_KEY: process.env.EVOPAY_API_KEY !== undefined,
  PORT: process.env.PORT !== undefined,
});
const app = express(); app.disable("x-powered-by");
app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error("CORS origin not allowed")); }, methods: ["GET", "POST"], allowedHeaders: ["Authorization", "Content-Type"] }));
app.use(express.json({ limit: "32kb" })); app.use(healthRouter); app.use("/api/payments", paymentsRouter); app.use(webhooksRouter); app.use(reconciliationRouter); app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(error); if (res.headersSent) return; res.status(500).json({ error: "Internal server error" }); });
app.listen(env.PORT, "0.0.0.0", () => console.log("NexusStore backend listening on port " + env.PORT));
