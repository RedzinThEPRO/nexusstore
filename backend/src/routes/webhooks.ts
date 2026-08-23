import { Router } from "express";
export const webhooksRouter = Router();
// EvoPay's callback payload is intentionally not guessed. No payment is changed here.
webhooksRouter.post("/webhooks/evopay", (_req, res) => res.status(501).json({ error: "EvoPay webhook mapping is not configured" }));
