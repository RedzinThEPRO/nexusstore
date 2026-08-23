import { z } from "zod";

export const EVO_PAY_STATUSES = ["PENDING", "COMPLETED", "CANCELED", "WAITING_FOR_REFUND", "REFUNDED", "EXPIRED"] as const;
export const evoPayWebhookSchema = z.object({ id: z.string().min(1).max(200), type: z.literal("DEPOSIT"), status: z.enum(EVO_PAY_STATUSES), amount: z.number().finite().positive(), endToEndId: z.string().nullable(), payerDocument: z.string().nullable(), payerName: z.string().nullable() }).strict();
export type EvoPayWebhook = z.infer<typeof evoPayWebhookSchema>;
export const eventKey = (event: EvoPayWebhook) => event.id + ":" + event.status;
export const mapPaymentStatus = (status: EvoPayWebhook["status"]) => status === "CANCELED" ? "CANCELLED" : status === "EXPIRED" ? "EXPIRED" : status === "REFUNDED" ? "REFUNDED" : "PENDING";
