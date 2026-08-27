import test from "node:test";
import assert from "node:assert/strict";
import { createOrderSchema, itemSchema, toRpcItems, translateRpcError } from "../src/services/checkout-validation.js";

const productId = "11111111-1111-4111-8111-111111111111";
const customer = {
  fullName: "Fulano de Tal",
  cpf: "52998224725",
  birthDate: "2000-01-01",
  email: "fulano@example.com",
  phone: "11999999999",
};

test("aceita item sem variante (produto único)", () => {
  const item = itemSchema.parse({ product_id: productId, quantity: 2 });
  assert.equal(item.variant_id, undefined);
});

test("aceita item com variante", () => {
  const item = itemSchema.parse({ product_id: productId, variant_id: "variant-1", quantity: 1 });
  assert.equal(item.variant_id, "variant-1");
});

test("rejeita quantidades inválidas", () => {
  for (const quantity of [0, -1, 1.5, 101]) {
    assert.throws(() => itemSchema.parse({ product_id: productId, quantity }));
  }
});

test("rejeita variante vazia e product_id que não é uuid", () => {
  assert.throws(() => itemSchema.parse({ product_id: productId, variant_id: "", quantity: 1 }));
  assert.throws(() => itemSchema.parse({ product_id: "not-a-uuid", quantity: 1 }));
});

test("rejeita preço, estoque ou total enviados pelo navegador", () => {
  assert.throws(() => itemSchema.parse({ product_id: productId, quantity: 1, price: 0.01 }));
  assert.throws(() => itemSchema.parse({ product_id: productId, quantity: 1, stock: 999 }));
  assert.throws(() => createOrderSchema.parse({ customer, items: [{ product_id: productId, quantity: 1 }], total: 1 }));
});

test("exige ao menos um item", () => {
  assert.throws(() => createOrderSchema.parse({ customer, items: [] }));
});

test("payload enviado ao RPC contém apenas identificadores, quantidade e free fire id", () => {
  const input = createOrderSchema.parse({
    customer: { ...customer, freeFireId: "123456789" },
    items: [
      { product_id: productId, quantity: 2 },
      { product_id: productId, variant_id: "variant-2", quantity: 1 },
    ],
  });
  assert.deepEqual(toRpcItems(input), [
    { product_id: productId, variant_id: null, quantity: 2, free_fire_id: "123456789" },
    { product_id: productId, variant_id: "variant-2", quantity: 1, free_fire_id: "123456789" },
  ]);
});

test("traduz erros de variante e estoque do banco", () => {
  assert.equal(translateRpcError("variant required"), "Selecione uma opção do produto antes de continuar.");
  assert.equal(translateRpcError("variant unavailable"), "Opção indisponível ou sem estoque suficiente.");
  assert.equal(translateRpcError("product unavailable"), "Produto indisponível ou sem estoque suficiente.");
  assert.equal(translateRpcError("stock changed, retry checkout"), "O estoque mudou durante a compra. Tente novamente.");
  assert.equal(translateRpcError("boom"), "Não foi possível criar o pedido.");
});
