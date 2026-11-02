-- =====================================================================
-- Ipanz Store — authorise your first administrator
--
-- 1. Supabase Dashboard -> Authentication -> Users -> "Add user" -> "Create new user"
--    Enter your email + a strong password, tick "Auto Confirm User".
--    (The password is typed only into Supabase; it is never stored in this project.)
-- 2. Replace the email below with that exact email and run this in the SQL Editor.
-- 3. Visit /admin on your site and sign in.
--
-- To add more admins later, run it again with another email.
-- To remove an admin:  delete from public.admins where user_id = (select id from auth.users where email = '...');
-- =====================================================================

insert into public.admins (user_id)
select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com'
on conflict (user_id) do nothing;

-- Verify: should return one row.
select a.user_id, u.email from public.admins a join auth.users u on u.id = a.user_id;
