-- ============================================================================
-- 0001_init_schema.sql — TEA Group core schema
-- Tables, enums, indexes, triggers. RLS lives in 0002; storage in 0003.
-- ============================================================================

-- Required extensions (pgcrypto for gen_random_uuid(); provided by Supabase).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums (kept in sync with @tea/shared zod schemas)
-- ---------------------------------------------------------------------------
create type user_role as enum ('admin', 'editor');

create type project_category as enum (
  'line-automation',
  'control-cabinets',
  'plc-scada',
  'system-integration',
  'maintenance',
  'other'
);

create type project_status as enum ('draft', 'published', 'archived');
create type parse_status as enum ('idle', 'pending', 'processing', 'done', 'failed');
create type section_type as enum (
  'overview',
  'equipment',
  'specs',
  'operating',
  'maintenance',
  'safety',
  'other'
);
create type section_status as enum ('draft', 'published');
create type contact_status as enum ('new', 'read', 'replied', 'archived');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles: extends auth.users with app-level role.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'editor',
  full_name text,
  is_locked boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- settings: editable Headless-CMS layer (key -> jsonb value).
create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category project_category not null default 'other',
  title text not null,
  client text,
  location text,
  date date,
  status project_status not null default 'draft',
  description_vi text,
  description_en text,
  images jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  parse_status parse_status not null default 'idle',
  parse_version int not null default 0,
  parse_error text,
  -- Persisted xyflow/dagre node positions from the admin editor.
  position jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_status_idx on public.projects (status);
create index projects_category_idx on public.projects (category);
create index projects_date_idx on public.projects (date desc);

-- project_sections: child nodes auto-generated from HDVH documents.
create table public.project_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type section_type not null default 'other',
  title_vi text,
  title_en text,
  content_vi text,
  content_en text,
  items jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  source_doc text,
  status section_status not null default 'draft',
  parse_version int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_sections_project_idx on public.project_sections (project_id);
create index project_sections_project_status_idx on public.project_sections (project_id, status);

-- contact_messages: submissions from the public contact form.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  body text not null,
  status contact_status not null default 'new',
  ip text,
  created_at timestamptz not null default now()
);

create index contact_messages_created_idx on public.contact_messages (created_at desc);

-- audit_logs: who changed what, when.
create table public.audit_logs (
  id bigserial primary key,
  actor uuid references auth.users (id),
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Auto-maintain updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger project_sections_set_updated_at
  before update on public.project_sections
  for each row execute function public.set_updated_at();

-- Auto-create a profile when a new auth user signs up (default role: editor).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'editor',
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helper: current user's app role (used by RLS policies).
-- NOTE: named `current_user_role` — `current_role` is a SQL reserved keyword.
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;
