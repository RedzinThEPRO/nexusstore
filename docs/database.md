# Banco de Dados

## Supabase (PostgreSQL)

Execute `SUPABASE_SETUP.sql` no SQL Editor do Supabase para criar toda a estrutura.

## Tabelas

| Tabela | Descrição |
|---|---|
| `profiles` | Perfis de usuário (extende auth.users) |
| `categories` | Categorias de produtos |
| `products` | Produtos da loja |
| `orders` | Pedidos |
| `order_items` | Itens de cada pedido |
| `payments` | Pagamentos |
| `payment_events` | Eventos de webhook (idempotência) |
| `deliveries` | Entregas |
| `delivery_chats` | Chats de entrega |
| `chat_messages` | Mensagens do chat |
| `notifications` | Notificações |
| `reviews` | Avaliações de produtos |
| `coupons` | Cupons de desconto |
| `coupon_usages` | Uso de cupons por usuário |
| `inventory` | Estoque |
| `inventory_movements` | Movimentações de estoque |
| `audit_logs` | Logs de auditoria |

## RLS

Todas as tabelas têm Row Level Security habilitada com políticas por verbo CRUD.

- Usuários só acessam seus próprios dados
- Admins (SUPER_ADMIN) têm acesso a tudo
- Dados públicos (produtos, categorias, avaliações) são legíveis por todos

## Modo Demo

Sem credenciais do Supabase, o sistema usa `localStorage` para persistir dados. As mesmas funções em `lib/api.ts` operam sobre o armazenamento local.
