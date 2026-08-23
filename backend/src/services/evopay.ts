import { z } from "zod";
const BASE_URL = "https://pix.evopay.cash/v1";
const transactionSchema = z.object({ id: z.string().min(1), type: z.literal("DEPOSIT").optional(), status: z.string().min(1), amount: z.number().finite().positive(), taxAmount: z.number().finite().nonnegative().optional(), amountWithTax: z.number().finite().positive().optional(), qrCodeText: z.string().optional(), qrCodeBase64: z.string().optional(), qrCodeUrl: z.string().url().optional() }).strict();
const responseSchema = z.union([transactionSchema, z.object({ data: transactionSchema }).strict()]).transform((body) => "data" in body ? body.data : body);
export type EvoPayChargeInput = { amount: number; callbackUrl: string; payerName: string; payerDocument: string; payerEmail: string; externalReference: string };
export type EvoPayTransaction = z.infer<typeof transactionSchema>;
export class EvoPayError extends Error { constructor(public readonly status: number, message: string) { super(message); } }
export class EvoPayService {
  constructor(private readonly apiKey: string) {}
  async createPixCharge(input: EvoPayChargeInput): Promise<EvoPayTransaction> { const response = await fetch(BASE_URL + "/pix", { method: "POST", headers: { "API-Key": this.apiKey, "Content-Type": "application/json" }, body: JSON.stringify(input) }); return this.read(response); }
  async getPixTransaction(id: string): Promise<EvoPayTransaction> { const response = await fetch(BASE_URL + "/pix?id=" + encodeURIComponent(id), { headers: { "API-Key": this.apiKey, "Content-Type": "application/json" } }); return this.read(response); }
  private async read(response: Response): Promise<EvoPayTransaction> { const body: unknown = await response.json().catch(() => null); if (!response.ok) throw new EvoPayError(response.status, "EvoPay request failed"); const parsed = responseSchema.safeParse(body); if (!parsed.success) throw new EvoPayError(502, "Invalid response from EvoPay"); return parsed.data; }
}
