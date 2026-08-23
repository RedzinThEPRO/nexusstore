import { renderEmail, type EmailTemplate } from './email-templates.ts';
export async function sendTransactionalEmail(input: { to: string; template: EmailTemplate; data: Record<string, string | number | undefined> }) {
  const apiKey = Deno.env.get('RESEND_API_KEY'), from = Deno.env.get('RESEND_FROM_EMAIL');
  if (!apiKey || !from) throw new Error('Resend não configurado no ambiente da função.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to)) throw new Error('Destinatário inválido.');
  const rendered = renderEmail(input.template, input.data);
  const response = await fetch('https://api.resend.com/emails', { method:'POST', headers:{ Authorization:'Bearer '+apiKey, 'Content-Type':'application/json' }, body:JSON.stringify({ from, to:[input.to], subject:rendered.subject, html:rendered.html }) });
  if (!response.ok) throw new Error('Resend recusou o envio ('+response.status+').');
  return await response.json();
}