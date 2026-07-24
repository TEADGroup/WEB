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
  ('contact_email', '"contact@teagroup.vn"'::jsonb),
  ('ai_config', '{"provider":"ollama","ollamaBaseUrl":"http://localhost:11434","ollamaModel":"qwen2.5vl:latest"}'::jsonb),
  ('ai_memory', '{"typeCorrections":{},"promptTips":[],"chatNotes":[],"userFacts":[],"updatedAt":"2026-07-18T00:00:00.000Z"}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Sample published project (non-featured)
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

-- ---------------------------------------------------------------------------
-- Featured projects (hiển thị trên 3D Timeline)
-- ---------------------------------------------------------------------------
insert into public.projects
  (slug, category, title, client, location, date, status, description_vi, description_en,
   is_featured, featured_year, featured_month, featured_order, company_logo_url, scope_vi, scope_en)
values
  (
    'scada-nha-may-xyz',
    'plc-scada',
    'Hệ thống SCADA Nhà máy XYZ',
    'Công ty TNHH XYZ',
    'Bình Dương, Việt Nam',
    '2026-06-15',
    'published',
    'Thiết kế, lắp đặt hệ thống SCADA cho 3 dây chuyền sản xuất với hơn 200 điểm giám sát.',
    'Design and installation of SCADA system for 3 production lines with over 200 monitoring points.',
    true, 2026, 6, 1, '/images/clients/xyz.svg',
    'Thiết kế, lắp đặt hệ thống SCADA cho 3 dây chuyền sản xuất',
    'Design and installation of SCADA system for 3 production lines'
  ),
  (
    'tu-dien-mcc',
    'control-cabinets',
    'Tủ điện MCC Nhà máy Chế biến',
    'Nhà máy Chế biến ABC',
    'Đồng Nai, Việt Nam',
    '2026-03-20',
    'published',
    'Chế tạo và lắp đặt 15 tủ MCC cho nhà máy chế biến thực phẩm, tích hợp biến tần và PLC.',
    'Fabrication and installation of 15 MCC cabinets for a food processing plant with VFD and PLC integration.',
    true, 2026, 3, 2, '/images/clients/foodco.svg',
    'Chế tạo 15 tủ MCC, tích hợp biến tần và PLC',
    'Fabrication of 15 MCC cabinets with VFD and PLC integration'
  ),
  (
    'tu-dien-trung-the',
    'control-cabinets',
    'Trạm điện trung thế KCN',
    'Khu công nghiệp Sen Hồ',
    'Bắc Ninh, Việt Nam',
    '2025-12-10',
    'published',
    'Cung cấp và lắp đặt trạm điện trung thế 22kV, tủ phân phối hạ thế cho toàn bộ khu công nghiệp.',
    'Supply and installation of 22kV medium-voltage substation and LV distribution for the whole industrial park.',
    true, 2025, 12, 1, '/images/clients/senho.svg',
    'Trạm 22kV + tủ phân phối hạ thế',
    '22kV substation + LV distribution cabinets'
  ),
  (
    'line-automation-robot',
    'line-automation',
    'Tự động hoá dây chuyền lắp ráp',
    'Tập đoàn Sản xuất DEF',
    'TP. Hồ Chí Minh, Việt Nam',
    '2025-09-05',
    'published',
    'Tích hợp robot ABB cho dây chuyền lắp ráp linh kiện điện tử, kết hợp vision AI kiểm tra chất lượng.',
    'ABB robot integration for electronics assembly line with AI vision quality inspection.',
    true, 2025, 9, 2, '/images/clients/def.svg',
    'Robot ABB + Vision AI cho lắp ráp linh kiện',
    'ABB robots + Vision AI for component assembly'
  ),
  (
    'plc-scada-nha-may',
    'system-integration',
    'Hệ thống PLC/SCADA Nhà máy Thuỷ sản',
    'Công ty Thuỷ sản GHI',
    'Cần Thơ, Việt Nam',
    '2025-06-18',
    'published',
    'Tích hợp hệ thống PLC Siemens và SCADA WinCC cho nhà máy chế biến thuỷ sản, 5 dây chuyền cấp đông.',
    'Siemens PLC and SCADA WinCC integration for a seafood processing plant with 5 freezing lines.',
    true, 2025, 6, 3, '/images/clients/ghi.svg',
    'PLC Siemens + SCADA WinCC cho 5 dây chuyền cấp đông',
    'Siemens PLC + SCADA WinCC for 5 freezing lines'
  ),
  (
    'bao-tri-nha-may',
    'maintenance',
    'Bảo trì hệ thống điện Nhà máy Sữa',
    'Công ty Sữa JKL',
    'Hà Nội, Việt Nam',
    '2025-03-01',
    'published',
    'Dịch vụ bảo trì dự phòng toàn bộ hệ thống điện và tự động hoá, cam kết phản hồi dưới 4 giờ.',
    'Preventive maintenance service for entire electrical and automation system, guaranteed <4hr response.',
    true, 2025, 3, 1, '/images/clients/jkl.svg',
    'Bảo trì điện + tự động hoá, phản hồi 4h',
    'Electrical & automation maintenance, 4hr response'
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
