const BASE_URL = "https://pix.evopay.cash/v1";

export type EvoPayChargeInput = {
  amount: number; callbackUrl: string; payerName: string; payerDocument: string;
  payerEmail: string; externalReference: string;
};

export type EvoPayTransaction = {
  id?: string; status?: string; amount?: number; taxAmount?: number;
  amountWithTax?: number; qrCodeText?: string; qrCodeBase64?: string; qrCodeUrl?: string;
};

export class EvoPayError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export class EvoPayService {
  constructor(private readonly apiKey: string) {}

  async createPixCharge(input: EvoPayChargeInput): Promise<EvoPayTransaction> {
    const response = await fetch(BASE_URL + "/pix", {
      method: "POST",
      headers: { "API-Key": this.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return this.read(response);
  }

  async getPixTransaction(id: string): Promise<EvoPayTransaction> {
    const response = await fetch(BASE_URL + "/pix?id=" + encodeURIComponent(id), {
      headers: { "API-Key": this.apiKey, "Content-Type": "application/json" },
    });
    return this.read(response);
  }

  private async read(response: Response): Promise<EvoPayTransaction> {
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new EvoPayError(response.status, "EvoPay request failed");
    return body?.data ?? body;
  }
}
