# Segurança

## Estado atual

A aplicação usa Supabase Auth + PostgreSQL como arquitetura de produção. O navegador nunca é uma fronteira de confiança: preços, cupons, estoque, permissões, totais e status de pedidos precisam ser recalculados e gravados por funções/rotas server-side.

## RLS

O `SUPABASE_SETUP.sql` habilita RLS e restringe perfis, pedidos, itens de pedido, entregas, chat, notificações, avaliações, cupons e logs. Clientes só leem os próprios dados; catálogo e avaliações são públicos apenas para leitura. A migração final remove a atualização de pedidos pelo cliente, fecha cupons para clientes e impede forjar mensagens administrativas.

## Autenticação administrativa

Não existem contas, senhas, e-mails de recuperação ou códigos TOTP no código-fonte. Crie a conta administrativa no Supabase Auth, confirme o e-mail e habilite MFA TOTP no painel/fluxo de autenticação. O papel `SUPER_ADMIN` deve ser atribuído apenas por operação protegida no banco. O e-mail de recuperação não é uma conta de login separada.

## Limitações do modo demo

O fallback local é apenas demonstração e não oferece segurança contra DevTools, XSS persistente ou manipulação de preços. Para produção, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, implemente checkout server-side/Edge Functions e nunca confie em dados enviados pelo cliente.

## Produção

Configure CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, rate limiting, validação de webhooks e envio de e-mails transacionais via provedor server-side.
