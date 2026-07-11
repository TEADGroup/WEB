-- =====================================================================
--  TEA Automation — Supabase schema cho auth + profile + avatar
--  Chạy toàn bộ file này trong: Supabase Dashboard → SQL Editor → New query.
--  (Xem SETUP-AUTH.md)
-- =====================================================================

-- ===================== PROFILES TABLE =====================
-- Mỗi user 1 row, join auth.users theo id. Chứa name + avatar_url.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text default '',
  avatar_url  text default '',
  created_at  timestamptz default now()
);

-- ===================== TRIGGER: tự tạo profile row khi signup =====================
-- Khi auth.users insert (register) → insert profiles row với name từ user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===================== RLS: user chỉ thấy/sửa row của mình =====================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ===================== STORAGE BUCKET: avatars (public read) =====================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- User đã đăng nhập chỉ được ghi vào thư mục của chính mình: avatars/{uid}/...
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Public read (avatar là ảnh hiển thị, URL CDN công khai)
drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public"
  on storage.objects for select
  using (bucket_id = 'avatars');
