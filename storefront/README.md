# CertPath Storefront

Next.js 16 storefront for the Medusa v2 training store. See the [root README](../README.md) for the full project overview.

```bash
npm install
cp .env.template .env.local   # set the backend URL and publishable key
npm run dev                   # http://localhost:3000
```

| Path | What it does |
| --- | --- |
| `src/lib/medusa.ts` | JS SDK client (JWT auth stored in localStorage). |
| `src/lib/api.ts` | Course, enrollment and certificate calls, plus the cart → payment → order checkout flow. |
| `src/providers/store-provider.tsx` | Region, customer session and the "backend waking up" state. |
| `src/app/*` | Pages: catalog, course, checkout, learning dashboard, lesson player, certificate, verification. |
