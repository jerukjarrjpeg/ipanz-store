-- =====================================================================
-- Ipanz Store — complete database setup
-- Run once in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- Safe to re-run (idempotent where practical).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Admin allow-list
-- Only users whose auth.users id is listed here are administrators.
-- Rows are added manually via SQL (see supabase/admin_setup.sql); there is
-- deliberately NO insert/update/delete policy, so nobody can self-promote.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

drop policy if exists "admins can read own row" on public.admins;
create policy "admins can read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Categories & products
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(btrim(name)) between 1 and 40),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  category_id uuid references public.categories (id) on delete set null,
  price       numeric(10,2) not null check (price >= 0 and price <= 100000),
  unit        text not null default 'pcs' check (char_length(btrim(unit)) between 1 and 30),
  stock       integer not null default 0 check (stock >= 0),
  image_path  text,                       -- path inside the 'product-images' bucket
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx   on public.products (is_active);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 3. Orders
-- Orders are created ONLY through place_order() and changed ONLY through
-- admin_set_order_status(). Clients have no direct write access.
-- ---------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  idempotency_key  uuid not null unique,
  customer_name    text not null,
  customer_phone   text not null,
  fulfilment       text not null check (fulfilment in ('pickup','delivery')),
  delivery_address text not null default '',
  notes            text not null default '',
  payment_method   text not null check (payment_method in ('cash','qr_transfer')),
  status           text not null default 'pending'
                   check (status in ('pending','confirmed','completed','cancelled')),
  subtotal         numeric(10,2) not null check (subtotal >= 0),
  delivery_fee     numeric(10,2) not null check (delivery_fee >= 0),
  total            numeric(10,2) not null check (total >= 0),
  stock_restored   boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx  on public.orders (status);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid references public.products (id) on delete set null,
  product_name text not null,               -- snapshot, survives product edits/deletes
  unit        text not null,
  unit_price  numeric(10,2) not null check (unit_price >= 0),
  quantity    integer not null check (quantity > 0),
  line_total  numeric(10,2) not null check (line_total >= 0)
);
create index if not exists order_items_order_idx   on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------
-- 4. Row Level Security + privileges
-- ---------------------------------------------------------------------
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Categories: public read, admin write
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Products: public sees active only; admin sees and writes everything
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (is_active or public.is_admin());
drop policy if exists "products admin insert" on public.products;
create policy "products admin insert" on public.products
  for insert to authenticated with check (public.is_admin());
drop policy if exists "products admin update" on public.products;
create policy "products admin update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "products admin delete" on public.products;
create policy "products admin delete" on public.products
  for delete to authenticated using (public.is_admin());

-- Orders & items: admin read only. No write policies exist at all.
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders
  for select to authenticated using (public.is_admin());
drop policy if exists "order_items admin read" on public.order_items;
create policy "order_items admin read" on public.order_items
  for select to authenticated using (public.is_admin());

-- Defence in depth: strip table privileges that RLS should never need to allow.
revoke all on public.orders, public.order_items from anon, authenticated;
grant select on public.orders, public.order_items to authenticated;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- ---------------------------------------------------------------------
-- 5. Internal helper: order -> JSON (not callable from the API)
-- ---------------------------------------------------------------------
create or replace function public._order_json(p_order_id uuid)
returns jsonb
-- Deliberately VOLATILE (not STABLE): a STABLE function would use the caller's older
-- snapshot and miss the order rows inserted earlier in the same call.
language sql volatile security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',               o.id,
    'order_number',     o.order_number,
    'status',           o.status,
    'customer_name',    o.customer_name,
    'customer_phone',   o.customer_phone,
    'fulfilment',       o.fulfilment,
    'delivery_address', o.delivery_address,
    'notes',            o.notes,
    'payment_method',   o.payment_method,
    'subtotal',         o.subtotal,
    'delivery_fee',     o.delivery_fee,
    'total',            o.total,
    'created_at',       o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', i.product_name, 'unit', i.unit, 'unit_price', i.unit_price,
               'quantity', i.quantity, 'line_total', i.line_total
             ) order by i.product_name)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o where o.id = p_order_id;
$$;
revoke all on function public._order_json(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. place_order(): the ONLY way customers create orders
--   * prices and stock come from the products table, never from the client
--   * product rows are locked in a fixed order (no deadlocks, no overselling)
--   * stock is deducted in the same transaction as the order insert
--   * idempotency key makes retries / double-clicks return the same order
--   * any failure rolls everything back
-- Delivery fee is defined here: RM0.50 per entire order (pickup is free).
-- ---------------------------------------------------------------------
create or replace function public.place_order(
  p_idempotency_key  uuid,
  p_customer_name    text,
  p_customer_phone   text,
  p_fulfilment       text,
  p_delivery_address text,
  p_notes            text,
  p_payment_method   text,
  p_items            jsonb
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  c_delivery_fee constant numeric(10,2) := 0.50;
  v_name    text := btrim(coalesce(p_customer_name, ''));
  v_phone   text := regexp_replace(coalesce(p_customer_phone, ''), '[\s\-\(\)]', '', 'g');
  v_addr    text := btrim(coalesce(p_delivery_address, ''));
  v_notes   text := btrim(coalesce(p_notes, ''));
  v_existing uuid;
  v_order_id uuid;
  v_number   text;
  v_subtotal numeric(10,2) := 0;
  v_fee      numeric(10,2) := 0;
  v_lines    jsonb := '[]'::jsonb;
  v_row      record;
  v_prod     public.products%rowtype;
  v_line     jsonb;
begin
  if p_idempotency_key is null then
    raise exception 'Missing request id. Please refresh and try again.' using errcode = 'P0001';
  end if;

  -- Serialise concurrent calls that share a key, then replay if already processed.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  select id into v_existing from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return public._order_json(v_existing);
  end if;

  -- Customer validation
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Please enter your name (2–80 characters).' using errcode = 'P0001';
  end if;
  if v_phone !~ '^\+?[0-9]{9,15}$' then
    raise exception 'Please enter a valid WhatsApp number, e.g. 0123456789.' using errcode = 'P0001';
  end if;
  if coalesce(p_fulfilment, '') not in ('pickup', 'delivery') then
    raise exception 'Please choose pickup or delivery.' using errcode = 'P0001';
  end if;
  if coalesce(p_payment_method, '') not in ('cash', 'qr_transfer') then
    raise exception 'Please choose a payment method.' using errcode = 'P0001';
  end if;
  if p_fulfilment = 'delivery' then
    if char_length(v_addr) < 8 or char_length(v_addr) > 300 then
      raise exception 'Please enter a full delivery address.' using errcode = 'P0001';
    end if;
    v_fee := c_delivery_fee;
  else
    v_addr := '';
  end if;
  if char_length(v_notes) > 500 then
    raise exception 'Order notes are too long (max 500 characters).' using errcode = 'P0001';
  end if;

  -- Basic abuse guard: limit rapid repeat orders from the same number.
  -- (For stronger protection add a CAPTCHA; see README "Known limitations".)
  if (select count(*) from public.orders
       where customer_phone = v_phone
         and status <> 'cancelled'
         and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many recent orders from this number. Please message us on WhatsApp instead.'
      using errcode = 'P0001';
  end if;

  -- Cart validation (shape only; values are re-read from the database below)
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Your cart is empty or invalid.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 40 then
    raise exception 'Your cart is empty or invalid.' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where case
      when jsonb_typeof(e) = 'object'
       and (e->>'product_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       and (e->>'quantity') ~ '^[0-9]{1,3}$'
      then false else true end
  ) then
    raise exception 'Your cart contains an invalid item.' using errcode = 'P0001';
  end if;

  -- Lock + validate each distinct product in primary-key order.
  for v_row in
    select (e->>'product_id')::uuid as product_id, sum((e->>'quantity')::int) as qty
    from jsonb_array_elements(p_items) e
    group by 1
    order by 1
  loop
    if v_row.qty < 1 or v_row.qty > 99 then
      raise exception 'Quantity must be between 1 and 99 per product.' using errcode = 'P0001';
    end if;

    select * into v_prod from public.products where id = v_row.product_id for update;

    if not found or not v_prod.is_active then
      raise exception 'A product in your cart is no longer available. Please review your cart.'
        using errcode = 'P0001';
    end if;
    if v_prod.stock < v_row.qty then
      raise exception '"%" only has % left in stock. Please reduce the quantity.',
        v_prod.name, v_prod.stock using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + (v_prod.price * v_row.qty);
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_prod.id, 'name', v_prod.name, 'unit', v_prod.unit,
      'price', v_prod.price, 'qty', v_row.qty);
  end loop;

  v_number := 'IPZ-' || lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (
    order_number, idempotency_key, customer_name, customer_phone, fulfilment,
    delivery_address, notes, payment_method, subtotal, delivery_fee, total)
  values (
    v_number, p_idempotency_key, v_name, v_phone, p_fulfilment,
    v_addr, v_notes, p_payment_method, v_subtotal, v_fee, v_subtotal + v_fee)
  returning id into v_order_id;

  for v_line in select * from jsonb_array_elements(v_lines) loop
    insert into public.order_items (order_id, product_id, product_name, unit, unit_price, quantity, line_total)
    values (
      v_order_id, (v_line->>'product_id')::uuid, v_line->>'name', v_line->>'unit',
      (v_line->>'price')::numeric, (v_line->>'qty')::int,
      (v_line->>'price')::numeric * (v_line->>'qty')::int);

    -- Rows are already locked; the CHECK (stock >= 0) is a final safety net.
    update public.products
       set stock = stock - (v_line->>'qty')::int
     where id = (v_line->>'product_id')::uuid;
  end loop;

  return public._order_json(v_order_id);
end;
$$;
revoke all on function public.place_order(uuid, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.place_order(uuid, text, text, text, text, text, text, jsonb)
  to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. admin_set_order_status(): the ONLY way order status changes
--   Allowed: pending -> confirmed | completed | cancelled
--            confirmed -> completed | cancelled
--   Cancelled and completed are final. Cancelling restores stock exactly once
--   (the order row is locked and flagged stock_restored).
-- ---------------------------------------------------------------------
create or replace function public.admin_set_order_status(p_order_id uuid, p_status text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  if coalesce(p_status, '') not in ('pending', 'confirmed', 'completed', 'cancelled') then
    raise exception 'Invalid status.' using errcode = 'P0001';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0001';
  end if;

  if v_order.status = p_status then
    return public._order_json(v_order.id);
  end if;

  if not (
       (v_order.status = 'pending'   and p_status in ('confirmed', 'completed', 'cancelled'))
    or (v_order.status = 'confirmed' and p_status in ('completed', 'cancelled'))
  ) then
    raise exception 'A % order cannot be changed to %.', v_order.status, p_status
      using errcode = 'P0001';
  end if;

  if p_status = 'cancelled' and not v_order.stock_restored then
    -- Lock affected products in a fixed order (same as place_order) to avoid deadlocks.
    perform 1 from public.products
      where id in (select product_id from public.order_items
                   where order_id = v_order.id and product_id is not null)
      order by id for update;

    update public.products p
       set stock = p.stock + i.qty
      from (select product_id, sum(quantity)::int as qty
              from public.order_items
             where order_id = v_order.id and product_id is not null
             group by product_id) i
     where p.id = i.product_id;

    update public.orders set stock_restored = true where id = v_order.id;
  end if;

  update public.orders set status = p_status, updated_at = now() where id = v_order.id;
  return public._order_json(v_order.id);
end;
$$;
revoke all on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 8. Storage: public-read product image bucket, admin-only writes
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Public buckets serve files by URL without a SELECT policy, so anonymous users
-- cannot list the bucket. Admins need SELECT for replace/delete operations.
drop policy if exists "product images admin read"   on storage.objects;
drop policy if exists "product images admin insert" on storage.objects;
drop policy if exists "product images admin update" on storage.objects;
drop policy if exists "product images admin delete" on storage.objects;

create policy "product images admin read" on storage.objects
  for select to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "product images admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "product images admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "product images admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------
-- 9. Starter categories (editable in the admin dashboard)
-- ---------------------------------------------------------------------
insert into public.categories (name, sort_order) values
  ('Snacks', 1), ('Drinks', 2), ('Instant food', 3), ('Frozen', 4), ('Sweets', 5), ('Others', 99)
on conflict (name) do nothing;
