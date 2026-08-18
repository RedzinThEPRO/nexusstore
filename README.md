# NexusStore — Loja Gamer Premium

<<<<<<< HEAD
Loja gamer digital profissional construída com React + TypeScript + Vite + Tailwind CSS.

## O que está implementado

### Loja (Etapa 2)
- Home com hero, categorias, destaques, ofertas, mais vendidos e novidades
- Header com logo, navegação, busca, notificações, perfil e carrinho
- Página de loja com filtros, busca e ordenação
- Página de produto com galeria, avaliações e adicionar ao carrinho
- Carrinho funcional (adicionar, remover, quantidade, subtotal)
- Página de categorias

### Checkout + PIX (Etapa 3)
- Checkout com dados pessoais (nome, sobrenome, CPF, data de nascimento)
- Cupom de desconto (validado no backend em produção)
- Pagamento via PIX com QR Code e código copia-e-cola
- Status do pedido: PENDING → PAID → DELIVERED
- Página de sucesso com confirmação

### Entregas + Chat + Notificações (Etapa 4)
- Entrega criada automaticamente após pagamento
- Chat privado por pedido (cliente e admin)
- Notificações no header com contador
- Status de entrega: PENDING → IN_PROGRESS → COMPLETED
- Botão "Confirmar Entrega" (admin) com confirmação
- Avaliação de produto no chat de entrega

### Painel Admin (Etapa 5)
- Dashboard com KPIs, gráficos e filtros de período
- Pedidos com filtros por status
- Entregas (pendentes/concluídas) com chat e confirmação
- Produtos: CRUD completo, imagens, preços, promoção, estoque
- Categorias: criar e excluir (você cria as suas)
- Cupons: CRUD completo
- Clientes: lista com dados e estatísticas
- Mensagens: chats pendentes e concluídos
- Avaliações: lista com remoção de avaliações específicas por produto
- Analytics: faturamento, ticket médio, conversão, tempo de entrega
- Logs de auditoria
- Configurações

### IA + Segurança (Etapa 6)
- Assistente de IA flutuante (botão 🤖)
- Responde sobre produtos, compras, PIX, entregas, pedidos
- Não acessa dados de outros clientes
- Logs de auditoria para ações administrativas

## Recursos especiais

- **ID do Free Fire**: não é pedido no cadastro/login. É solicitado apenas no checkout de produtos da categoria/jogo Free Fire, e enviado automaticamente no chat de entrega.
- **Categorias**: você cria as suas próprias no painel admin.
- **Avaliações**: o admin pode remover avaliações específicas de cada produto.
- **Admin como moderador**: o admin conversa com clientes no chat de entrega.
- **Confirmar entrega**: botão no topo do chat para o admin confirmar.

## Contas

As credenciais de administrador e cliente são configuradas internamente. O sistema funciona em modo local (localStorage) quando o Supabase não está configurado.

## Como executar

```bash
npm install
npm run dev
```

## Como construir

```bash
npm run build
```

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- React Router DOM 6
- Lucide React (ícones)
- Supabase (banco, auth, storage, realtime) — opcional em modo demo

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute `SUPABASE_SETUP.sql` no SQL Editor
3. Copie `.env.example` para `.env` e preencha:
   - `VITE_SUPABASE_URL` — URL do projeto
   - `VITE_SUPABASE_ANON_KEY` — Chave anônima
4. O sistema detecta automaticamente as credenciais e ativa o Supabase

Em modo demo (sem credenciais), o sistema usa localStorage para persistência.

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `PAYMENT_API_KEY` | Chave do gateway de pagamento (PIX) |
| `PAYMENT_WEBHOOK_SECRET` | Segredo do webhook |
| `AI_API_KEY` | Chave da API de IA |
| `RESEND_API_KEY` | Chave do Resend (e-mails) |
| `ADMIN_EMAIL` | E-mail do admin inicial |
| `ADMIN_INITIAL_PASSWORD` | Senha inicial do admin |

## Documentação

- [Arquitetura](docs/architecture.md)
- [Banco de Dados](docs/database.md)
- [Autenticação](docs/authentication.md)
- [Segurança](docs/security.md)
- [Deploy](docs/deployment.md)
- [IA](docs/ai.md)
- [Analytics](docs/analytics.md)

## Estrutura do Projeto

```
src/
├── components/     Componentes reutilizáveis (Header, Footer, UI, ProductCard, AIAssistant)
├── context/        Contextos React (Auth, Cart)
├── lib/            Lógica de negócio (api, store, supabase, format)
├── pages/          Páginas da aplicação
│   └── admin/      Páginas do painel admin
├── types/          Tipos TypeScript
└── App.tsx         Roteamento principal
```

## Próximos passos (não implementados)

- Integração real com gateway de PIX (webhook)
- IA conectada a API real
- Upload de imagens via Supabase Storage
- Realtime via Supabase (substituindo o polling atual)
- E-mails transacionais via Resend
=======
Loja gamer digital completa com produtos, carrinho, checkout, pagamento PIX, entregas com chat em tempo real, avaliações, painel administrativo e notificações.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Estilos:** Tailwind CSS (tema dark gamer com neon)
- **Banco de dados:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Email:** Resend (templates prontos)
- **Pagamento:** PIX (estrutura pronta para gateway)

## Como executar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente no arquivo `.env`:
   ```
   VITE_SUPABASE_URL=sua_url
   VITE_SUPABASE_ANON_KEY=sua_chave
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Para build de produção:
   ```bash
   npm run build
   ```

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `RESEND_API_KEY` | Chave da API do Resend (email) |
| `PAYMENT_API_KEY` | Chave do gateway de pagamento PIX |
| `PAYMENT_WEBHOOK_SECRET` | Secret do webhook de pagamento |
| `AI_API_KEY` | Chave da API de IA |
| `ADMIN_EMAIL` | Email do administrador principal |

## Funcionalidades implementadas

### Loja
- Home com banners, destaques, ofertas, mais vendidos e novidades
- Listagem de produtos com filtros e ordenação
- Página de produto com galeria de imagens e avaliações
- Busca por nome, descrição e jogo
- Páginas de categoria
- Carrinho com adicionar, remover, quantidade e subtotal

### Contas
- Cadastro (email, senha, nome de usuário — sem ID do Free Fire)
- Login
- Recuperação de senha
- Perfil editável (ID do Free Fire opcional no perfil)

### Checkout e Pagamento
- Checkout exige nome, sobrenome, CPF e data de nascimento
- ID do Free Fire só é pedido se o produto for da categoria Free Fire
- Criação de pedido como PENDING
- Tela de pagamento PIX com QR Code e copia e cola
- Confirmação automática (estrutura pronta para webhook do gateway)
- Status: PENDING, PAID, COMPLETED, CANCELLED

### Entregas e Chat
- Entrega criada automaticamente após pagamento confirmado
- Chat privado em tempo real (Realtime) entre cliente e admin
- Botão "Confirmar Entrega" (admin)
- Avaliação do produto pelo cliente após entrega concluída
- Notificações de nova mensagem, entrega concluída, etc.

### Painel Administrativo
- Menu lateral com 3 barrinhas (hambúrguer)
- Dashboard com faturamento, pedidos, clientes, ticket médio
- CRUD de produtos (com categoria do jogo, imagem, promoção, estoque)
- CRUD de categorias (você cria as categorias dos jogos)
- Gestão de pedidos (filtros por status)
- Gestão de entregas (iniciar atendimento, confirmar entrega, abrir chat)
- Gestão de avaliações (remover avaliações específicas, ocultar/mostrar)
- Lista de clientes com total gasto e pedidos
- CRUD de cupons
- Configurações do sistema

### Segurança
- RLS habilitado em todas as tabelas
- Função `is_admin()` verifica role no JWT
- Políticas de propriedade em todos os dados de usuário
- Admin tem acesso a dados necessários para entrega

## Banco de dados

O schema completo está em `supabase/migrations/`. A migration cria:

- profiles, categories, products, product_images
- carts, cart_items, orders, order_items
- payments, payment_events
- deliveries, delivery_chats, chat_messages
- reviews, notifications
- coupons, coupon_usages
- inventory_movements, audit_logs, email_log

## Email (Resend)

Templates HTML prontos em `supabase/templates/`:
- welcome, email-verification, password-recovery
- order-created, payment-approved
- delivery-started, delivery-completed, new-message

## Como tornar um usuário admin

No Supabase Dashboard, vá em Authentication > Users, clique no usuário e adicione em `raw_app_meta_data`:
```json
{ "role": "SUPER_ADMIN" }
```

## Deploy

O projeto pode ser hospedado em qualquer serviço compatível com Vite (Vercel, Netlify, Cloudflare Pages, etc). Não depende do Replit.
>>>>>>> 2022f095fed3ca168261813115e8bdae04551837
