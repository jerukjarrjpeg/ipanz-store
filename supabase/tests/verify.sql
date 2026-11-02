-- =====================================================================
-- Ipanz Store — database verification script
-- Run in the Supabase SQL Editor AFTER 001_ipanz_store.sql and admin_setup.sql.
-- Everything runs inside a transaction that is ROLLED BACK, so no data is kept.
-- If any check fails you get an error naming it. On success the last line returns
-- "all checks passed".
-- =====================================================================
begin;

do $$
declare
  v_admin uuid;
  v_prod  uuid;
  v_key   uuid := gen_random_uuid();
  o1 jsonb; o2 jsonb; o2b jsonb;
  v_stock int;
  v_ok boolean;
begin
  select user_id into v_admin from public.admins limit 1;
  if v_admin is null then
    raise exception 'No admin found. Run supabase/admin_setup.sql first.' using errcode = 'XX999';
  end if;

  insert into public.products (name, price, unit, stock) values ('__verify__', 2.50, 'pcs', 5)
    returning id into v_prod;

  -- 1. Delivery order: server-side price + RM0.50 fee, stock deducted
  o1 := public.place_order(gen_random_uuid(), 'Test User', '0123456789', 'delivery',
        '1 Test Street, Kuala Lumpur', '', 'cash',
        jsonb_build_array(jsonb_build_object('product_id', v_prod, 'quantity', 3)));
  assert (o1->>'total')::numeric = 8.00, 'delivery total should be 3 x 2.50 + 0.50';
  select stock into v_stock from public.products where id = v_prod;
  assert v_stock = 2, 'stock should be 2 after ordering 3 of 5';

  -- 2. Overselling is rejected and changes nothing
  v_ok := false;
  begin
    perform public.place_order(gen_random_uuid(), 'Test User', '0123456789', 'pickup', '', '', 'cash',
      jsonb_build_array(jsonb_build_object('product_id', v_prod, 'quantity', 3)));
    v_ok := true;
  exception when sqlstate 'P0001' then null;
  end;
  assert not v_ok, 'ordering more than available stock must be rejected';
  select stock into v_stock from public.products where id = v_prod;
  assert v_stock = 2, 'stock must be unchanged after a rejected order';

  -- 3. Same idempotency key twice -> same order, stock deducted once, pickup is free
  o2  := public.place_order(v_key, 'Test User', '0123456789', 'pickup', '', '', 'qr_transfer',
         jsonb_build_array(jsonb_build_object('product_id', v_prod, 'quantity', 1)));
  o2b := public.place_order(v_key, 'Test User', '0123456789', 'pickup', '', '', 'qr_transfer',
         jsonb_build_array(jsonb_build_object('product_id', v_prod, 'quantity', 1)));
  assert o2->>'order_number' = o2b->>'order_number', 'replayed request must return the same order';
  assert (o2->>'total')::numeric = 2.50, 'pickup must have no delivery fee';
  select stock into v_stock from public.products where id = v_prod;
  assert v_stock = 1, 'duplicate request must not deduct stock twice';

  -- 4. Anonymous users cannot change order status
  perform set_config('request.jwt.claims', '{}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  v_ok := false;
  begin
    perform public.admin_set_order_status((o1->>'id')::uuid, 'cancelled');
    v_ok := true;
  exception when sqlstate '42501' then null;
  end;
  assert not v_ok, 'non-admins must not be able to change order status';

  -- 5. Admin cancels: stock restored exactly once
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform public.admin_set_order_status((o1->>'id')::uuid, 'cancelled');
  select stock into v_stock from public.products where id = v_prod;
  assert v_stock = 4, 'cancelling 3 items should restore stock from 1 to 4';
  perform public.admin_set_order_status((o1->>'id')::uuid, 'cancelled');  -- repeat: no-op
  select stock into v_stock from public.products where id = v_prod;
  assert v_stock = 4, 'cancelling twice must not restore stock twice';

  -- 6. Cancelled orders cannot be reopened (would allow stock to be double-counted)
  v_ok := false;
  begin
    perform public.admin_set_order_status((o1->>'id')::uuid, 'confirmed');
    v_ok := true;
  exception when sqlstate 'P0001' then null;
  end;
  assert not v_ok, 'cancelled orders must not be reopened';
end $$;

rollback;

select 'all checks passed' as result;
