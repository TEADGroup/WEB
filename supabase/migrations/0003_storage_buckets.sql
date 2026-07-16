-- ============================================================================
-- 0003_storage_buckets.sql — Storage buckets + object policies
--   project-images : public read, staff write
--   project-docs   : admin only (HDVH documents are client-sensitive)
--   models-3d      : public read, admin write
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('project-docs', 'project-docs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('models-3d', 'models-3d', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- project-images (public read; staff write/update/delete)
-- ---------------------------------------------------------------------------
create policy "project_images_public_read"
  on storage.objects for select
  using (bucket_id = 'project-images');

create policy "project_images_staff_insert"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and public.current_user_role() in ('admin', 'editor'));

create policy "project_images_staff_update"
  on storage.objects for update
  using (bucket_id = 'project-images' and public.current_user_role() in ('admin', 'editor'))
  with check (bucket_id = 'project-images' and public.current_user_role() in ('admin', 'editor'));

create policy "project_images_staff_delete"
  on storage.objects for delete
  using (bucket_id = 'project-images' and public.current_user_role() in ('admin', 'editor'));

-- ---------------------------------------------------------------------------
-- project-docs (admin only — HDVH files are confidential)
-- ---------------------------------------------------------------------------
create policy "project_docs_admin_all"
  on storage.objects for all
  using (bucket_id = 'project-docs' and public.current_user_role() = 'admin')
  with check (bucket_id = 'project-docs' and public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- models-3d (public read; admin write)
-- ---------------------------------------------------------------------------
create policy "models_3d_public_read"
  on storage.objects for select
  using (bucket_id = 'models-3d');

create policy "models_3d_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'models-3d' and public.current_user_role() = 'admin');

create policy "models_3d_admin_update"
  on storage.objects for update
  using (bucket_id = 'models-3d' and public.current_user_role() = 'admin')
  with check (bucket_id = 'models-3d' and public.current_user_role() = 'admin');

create policy "models_3d_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'models-3d' and public.current_user_role() = 'admin');
