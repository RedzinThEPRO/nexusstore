const origin = Deno.env.get('APP_ORIGIN') ?? '';
const headers = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Content-Type': 'application/json',
};
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const evoPayKey = Deno.env.get('EVOPAY_API_KEY');
  if (!authorization || !supabaseUrl || !serviceKey || !evoPayKey) {
    return response({ error: 'Server integration not configured' }, 503);
  }

  let body: { items?: unknown; couponCode?: string; customer?: { name?: string; document?: string; email?: string } };
  try { body = await request.json(); } catch { return response({ error: 'Invalid request' }, 400); }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    return response({ error: 'A valid item list is required' }, 400);
  }

  const dbHeaders = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    'Content-Type': 'application/json',
  };
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: serviceKey },
  });
  if (!userResponse.ok) return response({ error: 'Unauthorized' }, 401);
  const user = await userResponse.json();

  const checkout = await fetch(`${supabaseUrl}/rest/v1/rpc/create_order_secure`, {
    method: 'POST',
    // Keep the end-user JWT so auth.uid() is the buyer inside the SECURITY DEFINER RPC.
    headers: { Authorization: authorization, apikey: serviceKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_items: body.items, p_coupon_code: body.couponCode ?? null }),
  });
  const order = await checkout.json().catch(() => null);
  if (!checkout.ok || !order?.order_id) return response({ error: 'Não foi possível validar o pedido.' }, 400);

  const chargePath = Deno.env.get('EVOPAY_CREATE_CHARGE_PATH') || '/pix';
  const charge = await fetch(`https://pix.evopay.cash/v1${chargePath}`, {
    method: 'POST',
    headers: { 'API-Key': evoPayKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Number(order.total),
      externalReference: order.order_id,
      payerName: body.customer?.name,
      payerDocument: body.customer?.document,
      payerEmail: body.customer?.email ?? user.email,
      callbackUrl: Deno.env.get('EVOPAY_WEBHOOK_URL'),
    }),
  });
  const chargeBody = await charge.json().catch(() => ({}));
  if (!charge.ok) return response({ error: 'Gateway de pagamento recusou a cobrança.' }, 502);

  const providerId = chargeBody.id ?? chargeBody.data?.id ?? null;
  await fetch(`${supabaseUrl}/rest/v1/payments`, {
    method: 'POST',
    headers: { ...dbHeaders, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      order_id: order.order_id,
      amount: order.total,
      status: 'PENDING',
      provider: 'evopay',
      provider_id: providerId,
      external_id: order.order_id,
      pix_code: chargeBody.qrCodeText ?? chargeBody.data?.qrCodeText ?? '',
      pix_qr: chargeBody.qrCodeBase64 ?? chargeBody.qrCodeUrl ?? chargeBody.data?.qrCodeBase64 ?? '',
      provider_status: chargeBody.status ?? 'PENDING',
    }),
  });

  return response({
    orderId: order.order_id,
    total: order.total,
    pixCode: chargeBody.qrCodeText ?? chargeBody.data?.qrCodeText ?? '',
    pixQr: chargeBody.qrCodeBase64 ?? chargeBody.qrCodeUrl ?? chargeBody.data?.qrCodeBase64 ?? '',
    providerId,
  });
});