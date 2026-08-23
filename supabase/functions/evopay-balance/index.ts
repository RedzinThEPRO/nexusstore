const cors = { 'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || 'null', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' };
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'GET') return new Response(JSON.stringify({ error:'Method not allowed' }), { status:405, headers:cors });
  const authorization = request.headers.get('Authorization');
  const url = Deno.env.get('SUPABASE_URL'), serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), evopayKey = Deno.env.get('EVOPAY_API_KEY');
  if (!authorization || !url || !serviceRole || !evopayKey) return new Response(JSON.stringify({ error:'Server integration not configured' }), { status:503, headers:cors });
  const userResponse = await fetch(url + '/auth/v1/user', { headers:{ Authorization:authorization, apikey:serviceRole } });
  if (!userResponse.ok) return new Response(JSON.stringify({ error:'Unauthorized' }), { status:401, headers:cors });
  const user = await userResponse.json();
  const profileResponse = await fetch(url + '/rest/v1/profiles?id=eq.' + encodeURIComponent(user.id) + '&select=role', { headers:{ Authorization:'Bearer '+serviceRole, apikey:serviceRole } });
  const profiles = await profileResponse.json();
  if (!profileResponse.ok || profiles[0]?.role !== 'SUPER_ADMIN') return new Response(JSON.stringify({ error:'Forbidden' }), { status:403, headers:cors });
  const response = await fetch('https://pix.evopay.cash/v1/balance', { headers:{ 'API-Key':evopayKey } });
  return new Response(await response.text(), { status:response.status, headers:cors });
});