-- ============================================================================
-- 0004_admin_only_write.sql — Thu hồi quyền ghi của editor, chỉ admin mới write
-- Đây là migration cuối cùng của Phase 3: đảm bảo RLS chỉ cho phép admin
-- INSERT/UPDATE/DELETE. Editor chỉ đọc.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
drop policy if exists "projects_staff_all" on public.projects;
create policy "projects_admin_all"
  on public.projects for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- project_sections
-- ---------------------------------------------------------------------------
drop policy if exists "sections_staff_all" on public.project_sections;
create policy "sections_admin_all"
  on public.project_sections for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- settings (admin update only; bỏ insert vì settings có sẵn key từ seed)
-- ---------------------------------------------------------------------------
drop policy if exists "settings_admin_insert" on public.settings;
-- settings_admin_update đã chỉ cho admin, giữ nguyên.

-- ---------------------------------------------------------------------------
-- profiles (admin all, trừ user tự update full_name)
-- ---------------------------------------------------------------------------
-- Giữ policy "profiles_update_own_name" cho user tự sửa tên
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Storage: project-images (chỉ admin write, public read giữ nguyên)
-- ---------------------------------------------------------------------------
drop policy if exists "project_images_staff_insert" on storage.objects;
drop policy if exists "project_images_staff_update" on storage.objects;
drop policy if exists "project_images_staff_delete" on storage.objects;

create policy "project_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and public.current_user_role() = 'admin');

create policy "project_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'project-images' and public.current_user_role() = 'admin')
  with check (bucket_id = 'project-images' and public.current_user_role() = 'admin');

create policy "project_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'project-images' and public.current_user_role() = 'admin');
