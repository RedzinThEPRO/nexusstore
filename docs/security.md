# Segurança

## RLS (Row Level Security)

Todas as tabelas têm RLS habilitado. Políticas garantem:
- Usuários só veem seus próprios pedidos, entregas, notificações
- Admins têm acesso total
- Produtos, categorias e avaliações são públicos para leitura

## Prevenção de ataques

- **IDOR/BOLA**: Acesso a pedidos/entregas de outros usuários é bloqueado por RLS
- **XSS**: React escapa conteúdo automaticamente; entradas de chat são renderizadas como texto
- **SQL Injection**: Supabase usa parameterized queries
- **Price manipulation**: Em produção, o backend recalcula preços (não confia no frontend)
- **Webhook spoofing**: Validação de assinatura do gateway (preparado)
- **Idempotência**: `payment_events` com `provider_event_id` único

## Dados sensíveis

- CPF e data de nascimento: acesso mínimo necessário
- Não expostos em APIs desnecessárias
- Protegidos por RLS

## Headers de segurança (para produção)

Configure no seu host/CDN:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`
- `Content-Security-Policy`

## Recomendações

- Use Cloudflare WAF na frente da aplicação
- Configure rate limiting no Supabase
- Monitore logs de auditoria
