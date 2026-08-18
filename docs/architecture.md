# Arquitetura

## Visão Geral

NexusStore é uma SPA (Single Page Application) construída com React + TypeScript + Vite.

## Camadas

### Frontend (`src/`)
- **components/** — Componentes reutilizáveis de UI
- **context/** — Contextos React para estado global (Auth, Cart)
- **lib/** — Lógica de negócio e acesso a dados
  - `api.ts` — Funções de CRUD que operam sobre localStorage (demo) ou Supabase (produção)
  - `store.ts` — Persistência local e seed de dados
  - `supabase.ts` — Cliente Supabase (ativado quando credenciais estão presentes)
  - `format.ts` — Utilitários de formatação
- **pages/** — Páginas organizadas por responsabilidade
- **types/** — Tipos TypeScript do domínio

### Backend (Supabase)
- **Database** — PostgreSQL com RLS (Row Level Security)
- **Auth** — Autenticação de usuários
- **Storage** — Buckets para imagens (product-images, store-assets, banners)
- **Realtime** — Preparado para chat, notificações e status

### Padrões
- **RBAC** — Roles USER e SUPER_ADMIN
- **RLS** — Políticas por verbo (SELECT, INSERT, UPDATE, DELETE)
- **Idempotência** — Preparado para webhooks de pagamento
- **Modo Demo** — Funciona sem Supabase usando localStorage

## Roteamento

- `/` — Home
- `/loja` — Loja com filtros
- `/produto/:slug` — Detalhe do produto
- `/categorias` — Lista de categorias
- `/carrinho` — Carrinho
- `/checkout` — Checkout + PIX
- `/login`, `/cadastro` — Autenticação
- `/perfil` — Perfil do usuário
- `/pedidos` — Histórico de pedidos
- `/pedido/:orderId` — Detalhe do pedido + chat de entrega
- `/admin/*` — Painel administrativo (12 sub-páginas)
