# Setup đăng nhập (Supabase) — TEA Automation

Trang dashboard giờ **bắt buộc đăng nhập**. Auth dùng **Supabase** (JWT ký server-side,
xác thực qua RLS → bảo mật thật). Code đã sẵn sàng, bạn chỉ cần tạo project Supabase
và dán 2 giá trị. Ước ~5 phút.

> Anon key lộ trong JS là **an toàn theo thiết kế** — ranh giới bảo mật là RLS
> (mỗi user chỉ thấy/sửa profile + avatar của chính mình), không phải bí mật key.

## 1. Tạo project Supabase

1. Vào https://supabase.com → đăng ký/đăng nhập → **New project**.
2. Đặt tên (vd `tea-auth`), chọn region gần, đặt DB password, **Create**.
3. Chờ ~2 phút cho project sẵn sàng.

## 2. Bật email/password auth

- Dashboard → **Authenti
cation → Sign In / Providers** → bật **Email**.
- (Tuỳ chọn) **Authentication → Settings**: nếu muốn đăng ký xong vào ngay
  (không cần check email) → **tắt** "Confirm email". Nếu bật, sau khi đăng ký
  user phải click link xác nhận trong email trước khi đăng nhập được.

## 3. Chạy SQL (tạo bảng `profiles` + RLS + bucket `avatars`)

- Dashboard → **SQL Editor → New query**.
- Dán toàn bộ nội dung `supabase/schema.sql` (trong repo) → **Run**.
- Kết quả: bảng `public.profiles` (name, avatar_url), trigger tự tạo row khi
  đăng ký, RLS chỉ cho user sửa row của mình, storage bucket `avatars` (public read).

> Bucket `avatars` cũng được tạo bằng SQL (không cần tạo tay trong UI).

## 4. Lấy URL + anon key, dán vào code

- Dashboard → **Project Settings (⚙) → API**.
- Copy **Project URL** và **anon public** key.
- Mở `assets/js/supabase-config.js`, điền vào 2 dòng:

```js
window.SUPABASE_URL = "https://xxxxx.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOi...";   // anon PUBLIC key (an toàn để lộ)
```

## 5. Xong — test

- Mở `login.html` (qua http server, không nên qua `file://` cho đầy đủ).
- Tab **Đăng ký** → nhập email + mật khẩu (+ tên) → vào dashboard.
- Dashboard header hiện avatar (placeholder nếu chưa upload) + tên.
- Click avatar → sang `profile.html` → đổi ảnh / tên / mật khẩu / đăng xuất.
- Mở dashboard ở tab ẩn danh (chưa login) → tự redirect về `login.html`.

## Lưu ý

- **GitHub Pages**: sau khi commit + push, bump `?v=` trên asset nếu đổi (đã
  set `?v=20260711`). User cần **hard-refresh** (Ctrl+Shift+R) lần đầu.
- **Không bao giờ** dán **service_role** key vào code — chỉ dùng **anon public**.
  Service_role key có quyền bỏ qua RLS, phải giữ bí mật ở server.
- Đổi mật khẩu trong profile dùng `supabase.auth.updateUser({password})` —
  Supabase yêu cầu mật khẩu ≥ 6 ký tự.
