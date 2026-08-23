# Deploy seguro das integrações

O frontend usa somente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (a publishable key). Chaves privadas nunca entram no bundle.

## Edge Functions

As funções em supabase/functions usam Secrets do runtime:

- RESEND_API_KEY e RESEND_FROM_EMAIL para e-mails transacionais.
- EVOPAY_API_KEY para o gateway de pagamentos.
- SUPABASE_SERVICE_ROLE_KEY somente no servidor para validar o usuário e consultar RBAC.
- SUPABASE_URL e APP_ORIGIN para configuração.

Configure os Secrets no Supabase Edge Functions; o arquivo .env.example contém apenas nomes e placeholders.

## Templates Resend

Os templates existentes são verify-code, recover-account, order-created, order-confirmed, order-delivered e notification. Todos os valores dinâmicos passam por escape HTML.

## Cloudflare

O token Cloudflare é de infraestrutura/deploy, não uma API de negócio. Ele não deve ser enviado ao navegador nem salvo no GitHub.
