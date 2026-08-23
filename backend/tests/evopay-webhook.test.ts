import test from "node:test";
import assert from "node:assert/strict";
import { evoPayWebhookSchema, eventKey, mapPaymentStatus } from "../src/services/evopay-webhook.js";
const base = { id: "tx-1", type: "DEPOSIT", status: "COMPLETED", amount: 100, endToEndId: null, payerDocument: null, payerName: null };
test("accepts a valid COMPLETED deposit", () => assert.equal(evoPayWebhookSchema.parse(base).status, "COMPLETED"));
test("accepts PENDING and maps non-final statuses safely", () => { assert.equal(mapPaymentStatus("PENDING"), "PENDING"); assert.equal(mapPaymentStatus("CANCELED"), "CANCELLED"); });
test("rejects WITHDRAW and unknown statuses", () => { assert.throws(() => evoPayWebhookSchema.parse({ ...base, type: "WITHDRAW" })); assert.throws(() => evoPayWebhookSchema.parse({ ...base, status: "WITHDRAWN" })); });
test("uses id plus status for idempotency", () => assert.equal(eventKey(base as never), "tx-1:COMPLETED"));
test("rejects invalid amount and missing fields", () => { assert.throws(() => evoPayWebhookSchema.parse({ ...base, amount: 0 })); assert.throws(() => evoPayWebhookSchema.parse({ ...base, payerName: undefined })); });
