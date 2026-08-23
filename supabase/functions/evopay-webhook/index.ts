const headers = { 'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? '', 'Access-Control-Allow-Headers': 'content-type,x-webhook-signature,x-webhook-event-id', 'Content-Type': 'application/json' };
const out = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return out({ error: 'Method not allowed' }, 405);
  const secret = Deno.env.get('EVOPAY_WEBHOOK_SECRET');
  const bodyText = await request.text();
  const signature = request.headers.get('x-webhook-signature');
  if (!secret || !signature || signature !== await sign(secret, bodyText)) return out({ error: 'Unauthorized' }, 401);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return out({ error: 'Server integration not configured' }, 503);

  let event: any;
  try { event = JSON.parse(bodyText); } catch { return out({ error: 'Invalid JSON' }, 400); }
  const status = String(event.status ?? event.data?.status ?? event.transaction?.status ?? '').toUpperCase();
  const externalId = event.externalReference ?? event.external_reference ?? event.externalId ?? event.external_id ?? event.orderId ?? event.data?.externalReference ?? event.transaction?.externalReference;
  const providerId = event.id ?? event.transactionId ?? event.data?.id ?? event.transaction?.id;
  const eventId = request.headers.get('x-webhook-event-id') ?? event.eventId ?? event.id;
  if (!externalId && !providerId) return out({ error: 'Missing transaction identifier' }, 400);

  const db = { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, 'Content-Type': 'application/json' };
  if (eventId) {
    const duplicate = await fetch(`${supabaseUrl}/rest/v1/payment_events?provider_event_id=eq.${encodeURIComponent(eventId)}&select=id`, { headers: db });
    if ((await duplicate.json().catch(() => [])).length) return out({ received: true, duplicate: true });
  }
  const query = externalId ? `external_id=eq.${encodeURIComponent(externalId)}` : `provider_id=eq.${encodeURIComponent(providerId)}`;
  const paymentResponse = await fetch(`${supabaseUrl}/rest/v1/payments?${query}&select=*`, { headers: db });
  const payments = await paymentResponse.json().catch(() => []);
  if (!paymentResponse.ok || !payments[0]) return out({ received: true, matched: false });
  const payment = payments[0];
  const paid = ['PAID', 'APPROVED', 'COMPLETED', 'CONFIRMED', 'RECEIVED'].includes(status);
  if (paid && Number(event.amount ?? event.data?.amount ?? payment.amount) !== Number(payment.amount)) return out({ error: 'Amount mismatch' }, 400);
  const mapped = paid ? 'PAID' : status === 'REFUSED' ? 'REFUSED' : status === 'EXPIRED' ? 'EXPIRED' : status === 'CANCELED' ? 'CANCELLED' : 'PENDING';
  await fetch(`${supabaseUrl}/rest/v1/payments?id=eq.${payment.id}`, { method: 'PATCH', headers: db, body: JSON.stringify({ status: mapped, provider_status: status, paid_at: paid ? new Date().toISOString() : null }) });
  if (paid) await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${payment.order_id}&payment_status=eq.PENDING`, { method: 'PATCH', headers: db, body: JSON.stringify({ payment_status: 'PAID', status: 'PAID' }) });
  if (eventId) await fetch(`${supabaseUrl}/rest/v1/payment_events`, { method: 'POST', headers: { ...db, Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ payment_id: payment.id, event_type: status || 'UNKNOWN', provider_event_id: eventId, payload: event, signature_valid: true }) });
  return out({ received: true, matched: true });
});