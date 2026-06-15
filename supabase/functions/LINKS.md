# LoyalQR — Local & Edge Function Links

Use this file while developing with `npm run dev` (default: **http://localhost:5173**).

## Local app URLs

| Page | URL |
|------|-----|
| Home (→ client) | http://localhost:5173/ |
| Customer signup | http://localhost:5173/client |
| Admin login | http://localhost:5173/admin |
| Employee login | http://localhost:5173/employee |
| Owner setup (first time) | http://localhost:5173/setup |
| Owner dashboard | http://localhost:5173/dashboard |
| Worker scanner | http://localhost:5173/worker |

Legacy redirects: `/login` → `/admin`, `/enrol` → `/client`

## Supabase Edge Functions

Base URL from `.env`: `VITE_SUPABASE_URL`  
Example project: `https://oqcvdstwgzmhyqfelqzc.supabase.co`

| Function | Endpoint | Verify JWT | Source file |
|----------|----------|------------|-------------|
| setup-owner | `{SUPABASE_URL}/functions/v1/setup-owner` | **OFF** | `supabase/functions/setup-owner/index.ts` |
| enrol-client | `{SUPABASE_URL}/functions/v1/enrol-client` | **OFF** | `supabase/functions/enrol-client/index.ts` |
| login-client | `{SUPABASE_URL}/functions/v1/login-client` | **OFF** | `supabase/functions/login-client/index.ts` |
| create-worker | `{SUPABASE_URL}/functions/v1/create-worker` | **ON** | `supabase/functions/create-worker/index.ts` |
| purchase-scan | `{SUPABASE_URL}/functions/v1/purchase-scan` | **ON** | `supabase/functions/purchase-scan/index.ts` |
| confirm-purchase-scan | `{SUPABASE_URL}/functions/v1/confirm-purchase-scan` | **ON** | `supabase/functions/confirm-purchase-scan/index.ts` |
| redeem-reward | `{SUPABASE_URL}/functions/v1/redeem-reward` | **ON** | `supabase/functions/redeem-reward/index.ts` |

### Deploy checklist (Supabase Dashboard)

1. Open each function in **Edge Functions**
2. Paste the **entire** matching `index.ts` from this repo
3. Set **Verify JWT** as in the table above
4. Click **Deploy**
5. Test: open the endpoint URL in browser — you should **not** see `NOT_FOUND`

## Code reference

Runtime helpers: `src/lib/links.ts`  
Settings page also lists live links under **Links** tab.
