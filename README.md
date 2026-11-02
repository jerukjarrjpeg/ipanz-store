# Ipanz Store

A mobile-first food store. Customers browse products, fill a cart, check out, and send their order to the shop through WhatsApp. The owner manages products, stock and orders from `/admin`.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Supabase (Postgres, Auth, Storage) · Vercel.

---

## What's in the box

| Area | Details |
|---|---|
| Storefront | Home, search, category chips, sort, in-stock filter, product pages, empty states. All products come from Supabase. |
| Cart | Persists in the browser; re-checks live price and stock on the cart and checkout pages. |
| Checkout | Name, WhatsApp number, pickup (free) or delivery (RM0.50 per order, address required), optional notes, optional QR bank transfer. |
| Order flow | `place_order()` database function validates, prices from the database, reserves stock and writes the order in one transaction, then the app opens a prefilled WhatsApp message to `+60 13-637 8872`. |
| Payment QR | `public/payment-qr.jpeg` (your supplied image) is shown at checkout with a download button. |
| Admin | Supabase Auth login, allow-listed admins only, product CRUD with image upload/replace, order list with Confirm / Complete / Cancel and restock. |
| Security | Row Level Security on every table, admin allow-list table, security-definer RPCs, storage policies. No secrets in the codebase. |

## Project layout

```
src/app/            pages: / , /product/[id], /cart, /checkout, /admin
src/components/     UI (storefront) and components/admin/*
src/lib/            config, supabase clients, cart, whatsapp message builder, types
supabase/migrations/001_ipanz_store.sql   full schema, RLS, functions, storage policies
supabase/admin_setup.sql                  authorise your first admin
supabase/tests/verify.sql                 rollback-safe database checks
public/payment-qr.jpeg                    payment QR shown at checkout
.env.example
```

---

## 1. Supabase setup checklist

Project: `llixyoiuzbttdmupezgj` (`https://llixyoiuzbttdmupezgj.supabase.co`).

1. **Run the schema.** Dashboard → **SQL Editor** → New query → paste all of `supabase/migrations/001_ipanz_store.sql` → **Run**. It is safe to run again. It creates tables, RLS policies, the `place_order` and `admin_set_order_status` functions, the `product-images` storage bucket and its policies, and starter categories.
2. **Create your admin login.** **Authentication → Users → Add user → Create new user.** Enter your email and a strong password and tick **Auto Confirm User**. The password lives only in Supabase.
3. **Authorise that user.** Open `supabase/admin_setup.sql`, replace `YOUR_ADMIN_EMAIL@example.com` with the same email, and run it in the SQL Editor. The final query should return one row. Only accounts listed in `public.admins` have any admin power; to add another admin, repeat with their email.
4. **Turn off public sign-ups.** **Authentication → Sign In / Providers** (or *Settings*) → disable **Allow new users to sign up**. Strangers could not do anything even if they signed up (they are not in `admins`), but there is no reason to allow it.
5. **Check the API keys.** **Project Settings → API Keys.** You need only the **publishable** key (already in `.env.example`) and the project URL. Never use or paste the `secret` / `service_role` key anywhere in this project.
6. **Verify the database (recommended).** Run `supabase/tests/verify.sql` in the SQL Editor. It rolls back everything it does and ends by returning `all checks passed`. It covers price/fee calculation, overselling, duplicate requests, non-admin access, cancellation restocking and no double restock.
7. **Confirm** in **Table Editor** that `admins`, `categories`, `products`, `orders`, `order_items` show *RLS enabled*, and in **Storage** that `product-images` exists.

> If sign-in or requests fail with a key error, use the project's legacy `anon` key as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` instead (it is also designed to be public).

## 2. Run locally

Requires Node.js 18.18+ (Node 20+ recommended).

```bash
unzip ipanz-store.zip && cd ipanz-store
cp .env.example .env.local        # values are already filled in for your project
npm install
npm run dev                       # http://localhost:3000
```

Check that it compiles before deploying:

```bash
npm run typecheck && npm run build
```

`npm install` creates `package-lock.json`; commit it.

## 3. Put the code on GitHub (existing repo)

Easiest, if your existing Ipanz Store repo is empty or you want to replace its contents:

```bash
cd ipanz-store
git init
git add .
git commit -m "Ipanz Store"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main        # add --force only if you intend to overwrite what's already there
```

If the repo already has files you want to keep: `git clone` it, copy the project files in (not `node_modules`), commit and push.

`.gitignore` already excludes `.env*` and `node_modules`. Do not commit real secrets.

## 4. Deploy on Vercel

1. Vercel → **Add New… → Project** → import your GitHub repo. Framework preset: **Next.js** (auto-detected). Leave build settings as default.
2. Open **Environment Variables** and add (for Production, Preview and Development):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://llixyoiuzbttdmupezgj.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your publishable key
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` = `60136378872`
3. **Deploy.** Each push to `main` redeploys. After changing env vars, redeploy.
4. Visit `https://<your-app>.vercel.app/admin`, sign in, and add products.

## 5. Day-to-day use

- **Add products:** `/admin` → Products → Add product. Hide a product with *Hide* rather than deleting it if you may sell it again.
- **Orders:** customers arrive as **Pending** once the order is saved (stock is already reserved). When their WhatsApp message arrives, press **Confirm**; after handing over, **Mark completed**. **Cancel and restock** returns the stock once.
- **Payment proof:** for QR transfers the customer sends a screenshot on WhatsApp; you check it against your bank/e-wallet before confirming.
- **Change the QR:** overwrite `public/payment-qr.jpeg` (same name) and redeploy. If the file is missing, checkout shows a clear placeholder message.
- **Change the delivery fee:** edit `c_delivery_fee` in the `place_order` function (re-run it in SQL) **and** `DELIVERY_FEE` in `src/lib/config.ts`. The database value is the one that is charged.
- **Change the WhatsApp number:** set `NEXT_PUBLIC_WHATSAPP_NUMBER`.

---

## How the important parts work

- **Prices can't be forged.** The browser sends only product ids and quantities. `place_order` reads current prices and stock from the database and computes the totals.
- **No overselling.** The function locks the product rows (always in the same order), checks stock, and deducts in the same transaction. Concurrent buyers queue on the lock; the later one gets "only N left".
- **No duplicate orders.** Each checkout attempt has a unique id (idempotency key). Double-clicks or retries return the existing order instead of creating another, and the button is disabled while submitting.
- **Cancellation restocks once.** `admin_set_order_status` locks the order, flags `stock_restored`, and treats *cancelled* and *completed* as final, so stock can't be restored twice or re-deducted.
- **Admin is enforced by the database.** Customers cannot read or write orders at all. Product writes, order reads, status changes and image uploads all check `is_admin()` in RLS or inside the function. The `/admin` page check is only a convenience.
- **WhatsApp honesty.** Opening WhatsApp doesn't mean a message was sent. The success screen says the order is saved, asks the customer to press Send in WhatsApp, and never claims it was delivered.

## Known limitations

- **Not built or run by the author of this ZIP.** The environment that generated it had no network access, so `npm install`, `next build`, the running app and the SQL were not executed. Source was syntax-checked and the SQL was reviewed by hand. Run `npm run build` and `supabase/tests/verify.sql` first and fix anything they report.
- **Unsent WhatsApp orders hold stock.** Stock is reserved when the order is saved, not when WhatsApp is sent (the app cannot know). Cancel stale *Pending* orders to put stock back.
- **Public order endpoint.** Anyone can call `place_order`. It validates everything and limits one phone number to 5 orders per hour, but a determined attacker can vary numbers. For stronger protection, add a CAPTCHA (e.g. Cloudflare Turnstile) in front of checkout.
- **Deleting a product** keeps past orders' item details, but a *cancelled* order can't restock a product that no longer exists. Prefer *Hide*.
- **Static QR.** A Malaysia National QR can't carry the order amount, so customers type it in; matching payments to orders is manual.
- **One image per product**, JPG/PNG/WebP up to 5 MB.
- **Free plans.** Supabase free projects pause after about a week of inactivity (resume from the dashboard) and have storage/egress limits. Vercel's Hobby plan is meant for personal, non-commercial use; a business may need a paid plan or another host.
