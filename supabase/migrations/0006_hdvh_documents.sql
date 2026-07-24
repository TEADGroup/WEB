-- ============================================================================
-- 0006_hdvh_documents.sql — HDVH document storage and parsing tracking
-- ============================================================================

-- project_documents: files uploaded for HDVH parsing
create table public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_url text,
  file_size bigint default 0,
  file_type text,
  status parse_status not null default 'pending',
  parse_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_documents_project_idx on public.project_documents (project_id);
create index project_documents_status_idx on public.project_documents (status);

-- project_documents_set_updated_at trigger
create trigger project_documents_set_updated_at
  before update on public.project_documents
  for each row execute function public.set_updated_at();
