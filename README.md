# NexusStore — Loja Gamer Premium

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
