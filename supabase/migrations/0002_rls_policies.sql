-- ============================================================================
-- 0002_rls_policies.sql — Row Level Security
-- The database is the last line of defense: even if a Route Handler leaks,
-- RLS blocks unauthorized rows. Matrix:
--   anon   : read only published projects/sections + all settings (site needs them)
--   editor : read/write project + section content (no user/settings mgmt)
--   admin  : everything + user/settings management
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.projects enable row level security;
alter table public.project_sections enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'admin');

-- A user may update only their own full_name.
create policy "profiles_update_own_name"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins manage all profiles.
create policy "profiles_admin_all"
  on public.profiles for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- settings (public read; admin write)
-- ---------------------------------------------------------------------------
create policy "settings_public_read"
  on public.settings for select
  using (true);

create policy "settings_admin_insert"
  on public.settings for insert
  with check (public.current_user_role() = 'admin');

create policy "settings_admin_update"
  on public.settings for update
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create policy "projects_public_read_published"
  on public.projects for select
  using (status = 'published');

create policy "projects_staff_all"
  on public.projects for all
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));

-- ---------------------------------------------------------------------------
-- project_sections
-- ---------------------------------------------------------------------------
create policy "sections_public_read_published"
  on public.project_sections for select
  using (status = 'published');

create policy "sections_staff_all"
  on public.project_sections for all
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));

-- ---------------------------------------------------------------------------
-- contact_messages (anon can submit; admin reads/manages)
-- ---------------------------------------------------------------------------
create policy "contact_anon_insert"
  on public.contact_messages for insert
  with check (true);

create policy "contact_admin_select"
  on public.contact_messages for select
  using (public.current_user_role() = 'admin');

create policy "contact_admin_update"
  on public.contact_messages for update
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- audit_logs (authenticated insert; admin read)
-- Service-role writes bypass RLS, so parser/contact handlers can log freely.
-- ---------------------------------------------------------------------------
create policy "audit_authenticated_insert"
  on public.audit_logs for insert
  with check (auth.uid() is not null);

create policy "audit_admin_select"
  on public.audit_logs for select
  using (public.current_user_role() = 'admin');
