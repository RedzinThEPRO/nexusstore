# Autenticação e segurança

## Regra de produção

A aplicação não oferece mais autenticação demo no navegador. Sem Supabase configurado, login, cadastro e acesso administrativo permanecem bloqueados. Nunca use credenciais em localStorage, código-fonte ou variáveis VITE: tudo com prefixo VITE é público no bundle.

## Supabase Auth

- Use Email/Password no Supabase Auth, com confirmação de e-mail ativada.
- O perfil deve ser criado por trigger seguro e o papel SUPER_ADMIN atribuído somente por operação administrativa protegida.
- O acesso ao dashboard é permitido apenas para usuários autenticados cujo perfil tenha role SUPER_ADMIN.
- O e-mail de recuperação é um canal de recuperação, não uma identidade de login separada.
- Para o administrador, habilite MFA TOTP no Supabase Auth e exija um fator verificado antes de liberar operações sensíveis.

## Conta administrativa

Não há e-mail, senha, segredo TOTP ou código de recuperação neste repositório. A conta precisa ser criada no Supabase Auth, confirmada por e-mail e vinculada ao perfil SUPER_ADMIN no banco. Gere o segredo TOTP dentro do fluxo de MFA do Supabase e armazene os códigos de recuperação fora do GitHub.

## Limites

O frontend não é uma fronteira de confiança: preços, cupons, estoque, totais, permissões, pagamentos e status de pedidos devem ser recalculados em funções server-side protegidas por RLS.
