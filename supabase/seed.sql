-- ============================================================================
-- seed.sql — runs after migrations on `supabase db reset` (LOCAL DEV ONLY).
-- Seeds editable settings + a sample published project so the public site and
-- the projects tree have data to render immediately.
-- NOTE: this file is NOT applied to production. Create your first admin there
--       via the runbook (docs/runbook.md).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Settings (mirrors @tea/shared DEFAULT_THEME_CONFIG + default content)
-- ---------------------------------------------------------------------------
insert into public.settings (key, value) values
  (
    'company',
    '{
      "name": "TEA Group",
      "name_en": "TEA Group",
      "slogan_vi": "Công nghệ tự động hoá tương lai",
      "slogan_en": "Future-forward automation technology",
      "description_vi": "TEA Group chuyên tự động hoá công nghiệp, điện tự động và tích hợp hệ thống cho nhà máy và công trình.",
      "description_en": "TEA Group specializes in industrial automation, electrical control, and system integration for plants and projects.",
      "address": "294/41/18 Đường số 8, P. Thông Tây Hội, TP. Hồ Chí Minh",
      "phone": "+84 28 0000 0000",
      "email": "contact@teagroup.vn",
      "logo_url": "/images/logo.png"
    }'::jsonb
  ),
  (
    'socials',
    '{"facebook": "", "linkedin": "", "youtube": "", "website": "https://teagroup.vn"}'::jsonb
  ),
  (
    'home_stats',
    '[
      {"key":"projects","value":"120+","label_vi":"Dự án triển khai","label_en":"Projects delivered"},
      {"key":"years","value":"15+","label_vi":"Năm kinh nghiệm","label_en":"Years of experience"},
      {"key":"clients","value":"50+","label_vi":"Khách hàng / nhà máy","label_en":"Clients / plants"},
      {"key":"support","value":"24/7","label_vi":"Hỗ trợ kỹ thuật","label_en":"Technical support"}
    ]'::jsonb
  ),
  (
    'theme_config',
    '{
      "phases": {
        "dawn":  {"from":"#DCEFFC","via":"#FBE9E7","to":"#FFF4EE","accent":"#0099FF","mode":"light"},
        "day":   {"from":"#E3F1FB","via":"#E9F6EF","to":"#F6F8FB","accent":"#0099FF","mode":"light"},
        "dusk":  {"from":"#1F3A5C","via":"#3B2E5C","to":"#5C2E47","accent":"#FF6666","mode":"dark"},
        "night": {"from":"#0A1626","via":"#0F1D33","to":"#141432","accent":"#33B5FF","mode":"dark"}
      }
    }'::jsonb
  ),
  ('contact_email', '"contact@teagroup.vn"'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Sample published project + a couple of published sections (tree child nodes)
-- ---------------------------------------------------------------------------
insert into public.projects
  (slug, category, title, client, location, date, status, description_vi, description_en)
values
  (
    'demo-packaging-line',
    'line-automation',
    'Dây chuyền đóng gói tự động',
    'ABC Manufacturing',
    'Bình Dương, Việt Nam',
    '2024-06-15',
    'published',
    'Hệ thống tự động hoá toàn tuyến đóng gói, tích hợp PLC và SCADA giám sát thời gian thực.',
    'Fully automated packaging line with integrated PLC and real-time SCADA monitoring.'
  )
on conflict (slug) do nothing;

insert into public.project_sections
  (project_id, type, title_vi, title_en, content_vi, content_en, items, status, sort_order)
select
  p.id,
  'overview',
  'Tổng quan hệ thống',
  'System overview',
  'Tổng quan cấu trúc và nguyên lý hoạt động của dây chuyền.',
  'Structure and operating principle of the line.',
  '["Mạng PLC Et*hernet"]'::jsonb,
  'published',
  0
from public.projects p
where p.slug = 'demo-packaging-line';

insert into public.project_sections
  (project_id, type, title_vi, title_en, content_vi, content_en, items, status, sort_order)
select
  p.id,
  'safety',
  'Cảnh báo an toàn',
  'Safety warnings',
  'Các lưu ý an toàn khi vận hành và bảo trì.',
  'Safety notes for operation and maintenance.',
  '[]'::jsonb,
  'published',
  1
from public.projects p
where p.slug = 'demo-packaging-line';
