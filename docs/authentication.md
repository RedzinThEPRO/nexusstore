# Autenticação

## Supabase Auth (produção)

- Email/senha
- Sessão persistida pelo Supabase
- Trigger cria profile automaticamente no signup

## Modo Demo

- Credenciais armazenadas localmente (apenas para demonstração)
- Sessão via localStorage
- Contas demo:
  - Admin: `admin@nexus.gg` / `admin123`
  - Cliente: `gamer@nexus.gg` / `gamer123`

## RBAC

- `USER` — Cliente padrão
- `SUPER_ADMIN` — Acesso ao painel admin

## Fluxo

1. Cadastro: email + senha + username (sem Free Fire ID)
2. Login: email + senha
3. Perfil: editável (nome, CPF, data de nascimento, Free Fire ID)
4. Checkout: dados pessoais preenchidos se ainda não existirem
5. Logout: limpa a sessão

## Notas

- O ID do Free Fire NÃO é pedido no cadastro ou login
- É solicitado apenas no checkout de produtos Free Fire
- Dados sensíveis (CPF, data de nascimento) são protegidos por RLS
