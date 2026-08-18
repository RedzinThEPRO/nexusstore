# Deploy

## Build

```bash
npm run build
```

Gera `dist/` com arquivos estáticos.

## Hospedagem

O projeto é uma SPA estática. Compatível com:
- Vercel
- Netlify
- Cloudflare Pages
- Qualquer host estático

## Configuração

1. Configure variáveis de ambiente no host:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Execute `SUPABASE_SETUP.sql` no Supabase
3. Faça deploy do `dist/`

## SPA Routing

Configure redirecionamento para `index.html` (todas as rotas devem servir o app).

### Vercel
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### Netlify
```
/*  /index.html  200
```

### Cloudflare Pages
Configure um `_redirects` file: `/* /index.html 200`
