# NexusStore — Loja Gamer Premium

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
