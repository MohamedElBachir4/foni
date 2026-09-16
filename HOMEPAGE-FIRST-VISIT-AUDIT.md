# Homepage First-Visit Hang — Technical Audit Report

**Project:** `foni` (Next.js storefront)  
**Scope:** First visit to `/` only  
**Constraint:** Read-only audit — no code was modified  
**Date:** 2026-07-31  

**Executive verdict:** The homepage Server Component does almost no data work. Perceived “stuck on loading” is almost always **client-side** after hydration: banner/product sections show `جاري التحميل...` while `/api/home/*` calls (especially **best-selling**) wait on heavy MongoDB work in the Express backend. The single case that can stay forever is `HomeBannerSlider`’s raw `fetch` with **no timeout**.

---

## 1. Project Structure

| Item | Value |
|------|--------|
| Next.js | `16.1.6` (`foni/package.json`) |
| React | `19.2.3` |
| React DOM | `19.2.3` |
| Router | **App Router** (`app/`). No `pages/` directory |
| Middleware | `foni/middleware.ts` |
| Config | `foni/next.config.ts` |

### Directory trees (relevant)

```
app/
  page.tsx                 ← homepage
  layout.tsx               ← root layout (wraps /)
  globals.css
  error.tsx
  global-error.tsx
  not-found.tsx
  robots.ts
  sitemap.ts
  product/[id]/loading.tsx ← NOT used by /
  admin/...                ← nested layouts; do NOT wrap /
  brand/, spare-parts/, search/, accounts/, ...
  (no app/loading.tsx)

pages/
  (does not exist)

lib/
  apiUrl.ts
  publicFetch.ts
  productsData.ts
  productImage.ts
  seo.ts
  pricing.ts
  brandLogos.ts
  useSearch.ts
  ... (helpers; no mongoose.connect)

components/
  HomePageClient.tsx
  HomeBannerSlider.tsx
  ProductGrid.tsx
  BrandGrid.tsx
  CategorySlider.tsx
  Navbar.tsx
  Footer.tsx
  Providers.tsx
  PopupAdModal.tsx
  ContactFab.tsx
  StaleDeploymentRecovery.tsx
  BestSellingCarousel.tsx
  LatestModelsCarousel.tsx
  ProductPeekCarousel.tsx
  SearchBar.tsx
  ...

middleware.ts
next.config.ts
package.json
```

**Note:** `mongoose` is listed in `foni/package.json` but is **not imported** anywhere in the Next.js app source. Mongo access for the homepage happens only in `server/` (Express) via `/api/*`.

---

## 2. Home Page Analysis

**File:** `app/page.tsx`

```tsx
export const metadata = buildMetadata({ ... });

export default function Home() {
  return <HomePageClient />;
}
```

| Pattern | Present on `/`? | Detail |
|---------|-----------------|--------|
| `async` function | **No** | `Home` is sync |
| `fetch()` | **No** (in page) | All fetches are in client children |
| Database query | **No** | None in Next.js |
| API call (SSR) | **No** | |
| `Promise` / `await` | **No** | |
| `Suspense` | **No** | |
| `loading.tsx` | **No** for `/` | Only `app/product/[id]/loading.tsx` |
| `redirect()` | **No** | |
| `router.push()` | **No** in page | Used later in Navbar/BrandGrid/SearchBar on user action |
| `cache` / `revalidate` on page | **No** | Inherited from root layout: `force-dynamic`, `revalidate = 0`, `fetchCache = "force-no-store"` |

### What actually runs after the page shell

`HomePageClient` (`"use client"`) mounts:

1. `Navbar` (+ `SearchBar` — fetch only on typing)
2. `HomeBannerSlider` → `GET /api/home/banners` (raw `fetch`, **no timeout**)
3. `ProductGrid` (`mixedLatest`) → `GET /api/home/latest-products` (`publicFetch`, 22s × 2 retries)
4. `ProductGrid` (`bestSelling`) → `GET /api/home/best-selling-products` (same client timeouts)
5. `CategorySlider` — static, no network
6. `BrandGrid` → `GET /api/brands` (`publicFetch`; UI shows static brands immediately)
7. `Footer` — static

### What blocks rendering?

| Layer | Blocks HTML/SSR? | Blocks perceived “loading”? |
|-------|------------------|-----------------------------|
| `app/page.tsx` | No data wait | No |
| Root `force-dynamic` | Forces dynamic RSC each request (cold Node can slow TTFB) | Mild blank period before shell |
| `HomeBannerSlider` `loading=true` | No | **Yes — can be infinite** if fetch never settles |
| Dual `ProductGrid` `apiLoading` | No | **Yes — up to ~45s** then error UI |
| Account `hydrated` gate | No | One tick delay before product fetches start |

---

## 3. Layout Analysis

**File:** `app/layout.tsx` (only layout wrapping `/`)

Nested layouts under `app/admin/**` do **not** wrap the homepage.

| Concern | Finding |
|---------|---------|
| `async` operations | **None** in RootLayout |
| Metadata | Sync `buildMetadata` + `title.template` + icons |
| Fonts | `next/font/google`: **Cairo** (weights 300–700, arabic+latin) + **Poppins** (600,700). Default `display: swap` — can delay styled paint, not infinite load |
| Providers | `Providers` → `AccountProvider` → `CartProvider` → `StaleDeploymentRecovery` |
| Context | Account + Cart (client) |
| `cookies()` / `headers()` / `draftMode()` | **Not used** |
| Auth (layout) | No server auth gate; optional client `/api/accounts/me` if token in localStorage |
| Cache exports | `dynamic = "force-dynamic"`, `revalidate = 0`, `fetchCache = "force-no-store"` |
| Sibling mounts | `PopupAdModal`, `ContactFab` (client fetches on every page including `/`) |

**Anything that waits before rendering children?**  
Server: no. Client: children render immediately; overlays/sections show their own loading states independently.

---

## 4. Middleware Analysis

**File:** `middleware.ts`

| Concern | Finding |
|---------|---------|
| Redirects | **None** |
| Rewrites | **None** (rewrites are in `next.config.ts`) |
| Authentication | **None** |
| Cookies | **None** read/written |
| Headers | Sets `Cache-Control: no-store` (and related) for HTML-like paths; long-cache for `/_next/static/` |
| Matcher | Skips common static extensions; `/` is matched |
| Infinite loops | **None** — always `NextResponse.next()` |

**Homepage path:** `/` → `applyNoStore(NextResponse.next())`.  
**Hang contribution:** Negligible latency; contributes to always-fresh HTML (pairs with `force-dynamic`).

---

## 5. Loading Flow

```
Browser GET /
        ↓
[BLOCK?] Middleware (header only — does not await data)
        ↓
[BLOCK?] Next.js dynamic SSR of RootLayout + page shell
         (force-dynamic; no data fetch; can be slow if Node cold)
        ↓
HTML + RSC payload for client tree
        ↓
Hydration
        ↓
Providers mount
  ├─ AccountProvider: localStorage → hydrated=true (1 tick)
  │    └─ optional fetch #A: GET /api/accounts/me   [timeout via publicFetch]
  ├─ CartProvider: localStorage only
  └─ StaleDeploymentRecovery: patches window.fetch
        ↓
HomePageClient mounts
        ↓
[BLOCK UI] fetch #1 HomeBannerSlider: GET /api/home/banners
           raw fetch — NO TIMEOUT — skeleton "جاري التحميل..." until settle
        ↓
[BLOCK UI] after hydrated:
           fetch #2 ProductGrid: GET /api/home/latest-products
           fetch #3 ProductGrid: GET /api/home/best-selling-products
           publicFetch 22s × up to 2 retries (~45s max)
        ↓
[parallel] fetch #4 BrandGrid: GET /api/brands (non-blocking UI)
[parallel] fetch #5 PopupAdModal: GET /api/popup-advertisements/public (no timeout; returns null until loaded)
[parallel] fetch #6 ContactFab: GET /api/contact-settings/public (no timeout; FAB hidden until loaded)
        ↓
Express / MongoDB (behind Nginx or Next rewrite)
  ├─ banners: light find
  ├─ latest-products: SparePart.aggregate + Phone.find×2 + PhoneType.find (timeouts 12s/18s)
  └─ best-selling: Order.aggregate + DailySalesArchive.aggregate + up to 45 sequential product lookups
                   (NO server maxTimeMS / handler timeout)
        ↓
Client setState → replace skeletons with content (or error UI for ProductGrid)
```

**Steps that can block perceived rendering (marked):**

1. Cold dynamic SSR / JS download — blank page (no root `loading.tsx`)
2. Banner fetch hang — infinite skeleton
3. Latest/best-selling slow/hang — “جاري التحميل...” up to ~45s
4. After deploy: `StaleDeploymentRecovery` hard reload loop (≥12s cooldown)

---

## 6. Database Analysis

**From the Next.js app before homepage paints:** **zero MongoDB queries.**  
All DB work is in Express (`server/controllers/homeController.js`, etc.) when the **browser** calls `/api/...`.

### Queries triggered by first homepage visit (via API)

| # | File | Function | Collection(s) | Indexes (known) | Blocks homepage UI? |
|---|------|----------|---------------|-----------------|---------------------|
| 1 | `homepageBannerController.js` | `listActive` | `HomepageBanner` | `{ order, createdAt }` — **no `{ active: 1 }`** | Yes — banner skeleton (can be forever client-side) |
| 2 | `homeController.js` | `getLatestActivityByPhoneType` | `SparePart` aggregate | `phoneType`, `phoneTypes`, `name`… — **no compound for stock+hidden+createdAt** | Yes — latest ProductGrid |
| 3 | `homeController.js` | `latestProducts` | `Phone` find×2 | Phone has `name`, `brand`, text — **no `createdAt`, no `phoneType`** | Yes |
| 4 | `homeController.js` | `latestProducts` | `PhoneType` + populate `Brand` | PhoneType `{ brand, name }`, `name` | Yes |
| 5 | `homeController.js` | `getTopSellingCandidates` | `Order` aggregate (`status: completed`, unwind items) | `{ status: 1 }` exists; still expensive at scale | Yes — best-selling grid |
| 6 | `homeController.js` | `getTopSellingCandidates` | `DailySalesArchive` aggregate | `{ year, month }`, `{ date }` | Yes |
| 7 | `homeController.js` | `findProductById` / `findProductByName` | `Phone` / `Accessory` / `SparePart` — **up to 45 sequential rounds**; name path uses **case-insensitive regex** | name indexes exist but regex `^...$` `i` often cannot use them efficiently | Yes — **highest DB risk** |
| 8 | brand controller | `list` | `Brand` | unique `name` | No (static brands already shown) |
| 9 | popup / contact controllers | public getters | small settings/ad docs | light | Soft (overlays only) |
| 10 | accounts (if logged in) | `me` | `Account` | email/phone indexes | No (does not gate ProductGrid; only `hydrated` does) |

**Server timeouts:**

- `latestProducts`: query `maxTimeMS = 12_000`, handler race `18_000` → 504
- `bestSellingProducts`: **no** `maxTimeMS`, **no** handler timeout

---

## 7. API Analysis

Endpoints called before / during first homepage display:

| URL | Caller | Timeout | Retries | Cache | Failure blocks rendering? |
|-----|--------|---------|---------|-------|---------------------------|
| `GET /api/home/banners` | `HomeBannerSlider` | **None** | 0 | browser default | **Yes — skeleton can stay forever** if promise never settles |
| `GET /api/home/latest-products` | `ProductGrid` | 22_000 ms | max 2 | `cache: "no-store"` | Yes until timeout/error (~45s), then error UI |
| `GET /api/home/best-selling-products` | `ProductGrid` | 22_000 ms | max 2 | `cache: "no-store"` | Same; backend may keep running up to Nginx ~180s |
| `GET /api/brands` | `BrandGrid` | `publicFetch` default ~55s (adaptive) | 3 | `no-store` | **No** — static brands shown first |
| `GET /api/popup-advertisements/public` | `PopupAdModal` | **None** | 0 | default | Soft — modal stays unloaded |
| `GET /api/contact-settings/public` | `ContactFab` | **None** | 0 | default | Soft — FAB hidden |
| `GET /api/accounts/me` | `AccountProvider` (if token) | publicFetch default | 3 | `no-store` | **No** for grids; errors swallowed |

**Routing note:** In production, Nginx typically proxies `/api` to Express `:5001`. Next.js `rewrites` in `next.config.ts` also map `/api/:path*` → `INTERNAL_API_URL || NEXT_PUBLIC_API_URL`. Either path still ends at the same Express handlers.

---

## 8. Suspense Analysis

| Mechanism | On homepage `/`? | Forever-fallback risk? |
|-----------|------------------|------------------------|
| `<Suspense>` | **No** | N/A (used on search/accounts only) |
| `app/loading.tsx` | **Missing** | No Suspense fallback; user may see blank HTML until shell |
| `app/product/[id]/loading.tsx` | Irrelevant | — |
| `next/dynamic` / `React.lazy` | **None** in project | No code-split Suspense on home |
| `React.cache()` / `unstable_cache` | **None** in app code | — |

**Closest “forever fallback”:** not Suspense — it is **`HomeBannerSlider`’s `loading` state** driven by an unterminated `fetch`.

---

## 9. Server Components

| Component | Async? | Blocking ops | Role |
|-----------|--------|--------------|------|
| `app/layout.tsx` `RootLayout` | Sync | Fonts/metadata only | Shell |
| `app/page.tsx` `Home` | Sync | Renders client child | Thin wrapper |

**Execution order:** Middleware → RootLayout → Home → serialize client component references.  
**Dependencies:** None on data.  
**Blocking operations:** None for Mongo/API. Dynamic rendering still means the Node process must produce HTML per request (`force-dynamic`).

All homepage content components are **Client Components**.

---

## 10. Client Components

| Component | Hooks of interest | Can freeze app? |
|-----------|-------------------|-----------------|
| `HomeBannerSlider` | `useEffect` + raw `fetch` | **Yes** — infinite loading UI (page still interactive elsewhere) |
| `ProductGrid` | `useEffect` + `publicFetch` gated on `hydrated` | Long freeze of **section** (~45s), then error; not whole app |
| `AccountProvider` | `useEffect` localStorage + optional `/me` | No freeze; silent catch |
| `CartProvider` | localStorage | No |
| `BrandGrid` | `useEffect` + `useRouter` | No |
| `PopupAdModal` / `ContactFab` | `useEffect` + raw `fetch` | Overlay only |
| `StaleDeploymentRecovery` | `useEffect` patches fetch; hard reload | Soft reload loop after deploy |
| `Navbar` / `SearchBar` | `useRouter`, `useEffect` | Search only on input; `router.push` on submit |
| `CategorySlider` | `useRouter` on click | No |
| `ProductPeekCarousel` | `useEffect` animation timers | No network |
| `HomePageClient` | `useState` only | No |

**Not found on homepage path:** `use`, `useTransition`, `useOptimistic`.

---

## 11. Network Risks

| Resource | Risk |
|----------|------|
| Express APIs via `/api/*` | Primary hang source under DB load |
| Banner/product images (`getProductImageUrl` → `/uploads`, Cloudinary, `api.foni-dz.com`) | Slow images don’t block React loading text, but can feel “stuck” visually |
| Google fonts (Cairo arabic + many weights) | Larger first-load CSS/font payload; `swap` prevents invisible text forever |
| CategorySlider pinimg URLs | External; failure is image-only |
| Framer Motion in PopupAdModal | Extra JS; not a hang |
| Analytics / third-party scripts | **None found** on homepage layout |
| `StaleDeploymentRecovery` fetch monkey-patch | Extra work on every fetch; reload on `/_next/static` 404 |

**Random hang candidates:** TCP stall to API with **no client AbortSignal** (banner/popup/contact); Mongo stall on best-selling with **no server timeout**.

---

## 12. Error Handling

| Location | Handling | Gap |
|----------|----------|-----|
| `HomeBannerSlider` | try/catch/finally | Catch only if fetch **rejects**; hanging TCP never hits finally |
| `ProductGrid` | catch → error UI + retry | Good; still long wait |
| `BrandGrid` | `.catch(() => {})` | Silent — OK (static fallback) |
| `AccountProvider` `/me` | `.catch(() => {})` | Stale local account possible |
| `PopupAdModal` / `ContactFab` | try/catch | Same hang-until-reject issue |
| `publicFetch` | timeouts + retries | Solid — **not used** by banner/popup/contact |
| `app/error.tsx` / `global-error.tsx` | Log + reset | No auto loop |
| `StaleDeploymentRecovery` | Broad string match → reload | Can mask real bugs / cause refresh loops |

**Unhandled promises:** ProductGrid chains are handled. Banner IIFE is handled **only** on reject/response.

---

## 13. Runtime Risks

| Risk | Assessment |
|------|------------|
| Infinite loops | No render loops found on `/` |
| Recursive rendering | None |
| Hydration risks | Client-only data after hydrate; possible mismatch low on home. `StaleDeploymentRecovery` treats `"hydrat"` in messages as reload trigger |
| Race conditions | `ProductGrid` uses generation ref + AbortController — handled well |
| Stale cache | sessionStorage `phones:grid:*` can show stale products briefly; HTML intentionally no-store |
| Deadlocks | None in JS; DB can pile concurrent best-selling work under traffic |
| Soft reload loop | `StaleDeploymentRecovery` every ≥12s if build assets 404 after deploy |
| `typescript.ignoreBuildErrors: true` | Allows latent runtime bugs into production builds |
| `generateBuildId: Date.now()` fallback | New asset hashes each build → increases stale-chunk reload risk |

---

## 14. Final Risk Report — TOP 10 Causes

| Rank | Probability | File | Function | Why it can freeze rendering | Suggested fix |
|------|-------------|------|----------|-----------------------------|---------------|
| 1 | **28%** | `server/controllers/homeController.js` | `bestSellingProducts` / `getTopSellingCandidates` / `findProductByName` | Unbounded Mongo aggregations + up to 45 sequential lookups (incl. case-insensitive regex). No `maxTimeMS`/handler timeout. Client waits ~45s on “جاري التحميل...”; under load feels like a hang. Intermittent with DB size/concurrency. | Add handler + query timeouts; precompute best-sellers (cache/cron); replace regex name lookup with exact/`collation` indexed match; batch `$in` lookups |
| 2 | **18%** | `components/HomeBannerSlider.tsx` | `useEffect` fetch `/api/home/banners` | Raw `fetch` with **no AbortController/timeout**. If proxy/backend stalls, `loading` stays `true` **forever** → dominant hero shows permanent skeleton. | Use `publicFetch` (or AbortSignal timeout); fail closed to empty banners |
| 3 | **14%** | `server/controllers/homeController.js` | `latestProducts` / `getLatestActivityByPhoneType` | Heavy `SparePart.aggregate` + Phone scans; missing indexes (`createdAt`, `phoneType`, stock compounds). Has 12s/18s caps but client still shows loading through retries (~45s). | Indexes for sort/filter paths; cache latest models; ensure 504 surfaces quickly once |
| 4 | **10%** | `components/ProductGrid.tsx` | homepage `useEffect` (×2 grids) | First visit fires **two** heavy home endpoints in parallel after hydrate; both show full-section “جاري التحميل...”. | Skeleton placeholders that don’t look like full-page lock; stagger/prioritize; shared cache; shorter timeout + single retry |
| 5 | **8%** | `app/layout.tsx` + missing `app/loading.tsx` | `dynamic = "force-dynamic"` | Every visit is dynamic SSR with no root loading UI. Cold PM2/Node → blank first paint before client shell; users report “stuck loading”. | Keep no-store for HTML if needed, but add lightweight `loading.tsx`; warm process; optional static shell for marketing chrome |
| 6 | **7%** | `components/StaleDeploymentRecovery.tsx` | `tryReload` / `shouldRecoverMessage` | After deploy, `/_next/static` 404 or broad errors (`is not defined`, `hydrat`) trigger hard reload every ≥12s — feels like hang/refresh loop on “first visit” after publish. | Narrow matchers; only reload on confirmed chunk errors; align `BUILD_ID` / asset caching |
| 7 | **5%** | `components/PopupAdModal.tsx` + `ContactFab.tsx` | mount `fetch` | No timeouts; usually non-blocking, but contribute to connection contention on first visit with the other API burst. | `publicFetch` with short timeout |
| 8 | **4%** | `next.config.ts` / Nginx path | `rewrites` / proxy | Mis-set `INTERNAL_API_URL` or upstream stall → all `/api` hangs. Infra “healthy” can still have intermittent upstream wait. | Health-check home endpoints; verify INTERNAL_API_URL=http://127.0.0.1:5001; proxy timeouts aligned with client |
| 9 | **3%** | `app/layout.tsx` fonts | `Cairo` + `Poppins` | Large Arabic multi-weight font download slows first meaningful paint on slow networks (not infinite). | Subset weights; `display: "swap"` explicit; preload critical weight only |
| 10 | **3%** | Rate limit + retries | `server` `apiLimiter` (120/min) + `publicFetch` retries | Shared NAT / bots → intermittent 429 → client backoff/retries elongates loading UI. | Per-route limits; respect Retry-After (already partially handled); don’t retry 429 aggressively on home |

**Probabilities are relative estimates for intermittent first-visit hang given healthy VPS metrics; they sum ≈100% of the modeled application-layer causes.**

---

## Appendix A — Homepage component import graph

```
app/layout.tsx
  Providers
    AccountProvider
    CartProvider
    StaleDeploymentRecovery
    children → app/page.tsx → HomePageClient
      Navbar → SearchBar
      HomeBannerSlider
      ProductGrid (mixedLatest) → LatestModelsCarousel → ProductPeekCarousel
      ProductGrid (bestSelling) → BestSellingCarousel → ProductPeekCarousel
      CategorySlider
      BrandGrid
      Footer
    PopupAdModal
    ContactFab
```

## Appendix B — Explicit non-causes for `/`

- Middleware redirect loops  
- Next.js mongoose connection  
- Root Suspense stuck forever  
- Server `redirect()` / `draftMode()` / `cookies()` on home  
- `Hero.tsx` / `RegisterPromptBanner.tsx` (not mounted on homepage)

---

*End of report. No source files were modified for this audit.*
