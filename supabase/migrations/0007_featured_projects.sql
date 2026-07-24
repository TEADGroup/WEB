-- ============================================================================
-- 0007_featured_projects.sql — Thêm cột featured vào bảng projects
-- Dùng bảng projects hiện tại, không tạo bảng mới.
-- ============================================================================

alter table public.projects
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_year int,
  add column if not exists featured_month int,
  add column if not exists featured_order int not null default 0,
  add column if not exists company_logo_url text,
  add column if not exists scope_vi text,
  add column if not exists scope_en text;

create index if not exists projects_featured_idx on public.projects (featured_year desc, featured_month desc, featured_order asc)
  where is_featured = true;
