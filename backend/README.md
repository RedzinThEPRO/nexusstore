# NexusStore Backend

Separate Node.js/TypeScript API for Render Web Service. The existing React/Vite frontend and Supabase SQL are unchanged.

## Render
- Root Directory: backend
- Build Command: npm install && npm run build
- Start Command: npm start
- Required environment variables: PORT (Render supplies it), FRONTEND_URL, BACKEND_PUBLIC_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EVOPAY_API_KEY

## Endpoints
- GET /health
- POST /api/payments/pix (Bearer Supabase user token; body: orderId and customer data). The amount is always read from the existing order in Supabase, never trusted from the browser.
- GET /api/payments/pix/:id (Bearer Supabase user token; reads status directly from EvoPay)
- POST /webhooks/evopay is deliberately disabled until EvoPay documents its callback payload. It cannot change payment state.

Secrets are server-only and must be entered in Render Environment settings, never committed or prefixed with VITE_.
