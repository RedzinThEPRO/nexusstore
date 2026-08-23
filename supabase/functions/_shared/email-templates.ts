export type EmailTemplate = 'verify-code' | 'recover-account' | 'order-created' | 'order-confirmed' | 'order-delivered' | 'notification';
type Data = Record<string, string | number | undefined>;
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c] ?? c));
const wrap = (title: string, body: string) => '<!doctype html><html lang="pt-BR"><body style="margin:0;background:#090b12;color:#f4f7fb;font-family:Arial,sans-serif"><main style="max-width:560px;margin:32px auto;padding:32px;background:#121722;border:1px solid #283044;border-radius:16px"><h1 style="color:#65ffb1">NexusStore</h1><h2>' + esc(title) + '</h2><div style="line-height:1.6;color:#d4dbea">' + body + '</div><hr style="border:0;border-top:1px solid #283044;margin:24px 0"><small style="color:#8d96aa">Se você não solicitou esta mensagem, ignore este e-mail.</small></main></body></html>';
export function renderEmail(template: EmailTemplate, data: Data) {
  const name = esc(data.name || 'cliente'), order = esc(data.order_id || ''), code = esc(data.code || ''), message = esc(data.message || '');
  const subjects: Record<EmailTemplate,string> = { 'verify-code':'Confirme seu e-mail — NexusStore', 'recover-account':'Recupere sua conta — NexusStore', 'order-created':'Pedido recebido — NexusStore', 'order-confirmed':'Pedido confirmado — NexusStore', 'order-delivered':'Pedido entregue — NexusStore', 'notification':'Nova notificação — NexusStore' };
  const body: Record<EmailTemplate,string> = {
    'verify-code':'<p>Olá, '+name+'.</p><p>Seu código de verificação é:</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#65ffb1">'+code+'</p><p>Ele expira em 10 minutos.</p>',
    'recover-account':'<p>Olá, '+name+'.</p><p>Use o link seguro enviado pelo Supabase Auth para redefinir sua senha.</p>',
    'order-created':'<p>Olá, '+name+'.</p><p>Recebemos o pedido <strong>'+order+'</strong>.</p>',
    'order-confirmed':'<p>Olá, '+name+'.</p><p>O pagamento do pedido <strong>'+order+'</strong> foi confirmado.</p>',
    'order-delivered':'<p>Olá, '+name+'.</p><p>O pedido <strong>'+order+'</strong> foi entregue.</p>',
    'notification':'<p>Olá, '+name+'.</p><p>'+message+'</p>'
  };
  return { subject: subjects[template], html: wrap(subjects[template], body[template]) };
}