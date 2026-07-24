# Plan: Image caption + auto-extract từ HDVH

## Context

Hiện tại:
- `projects.images` là `string[]` — chỉ URL, không có caption
- Khi upload HDVH, người dùng có thể kèm ảnh nhưng không có chú thích
- Khi AI parse HDVH, không có thông tin về ảnh trong kết quả
- Ảnh upload từ Project Detail không được persist vào DB (bug)

Người dùng muốn:
1. **AI tự động trích xuất ảnh từ file** — nhận diện ảnh trong PDF/DOCX
2. **Hoặc tự upload ảnh thủ công**
3. **Mỗi ảnh có caption/ghi chú**

## Phạm vi thay đổi

### 1. Data model — `packages/shared/src/schemas/project.ts`

Đổi `images: z.array(z.string())` thành:

```ts
export const projectImageSchema = z.object({
  url: z.string(),
  caption: z.string().default(''),
});
export type ProjectImage = z.infer<typeof projectImageSchema>;
```

Và `images: z.array(projectImageSchema).default([])`.

### 2. Types — `apps/web/src/types/supabase.ts`

Cập nhật comment/type cho images field (Json vẫn chấp nhận, chỉ cần note).

### 3. API upload — `apps/web/src/app/api/uploads/route.ts`

- Thêm field `caption` trong FormData (optional)
- Khi upload ảnh vào `project-images`, append `{ url, caption }` vào `projects.images` thay vì chỉ URL string

### 4. Auto-create — `apps/web/src/app/api/hdvh-parser/auto-create/route.ts`

- Khi upload ảnh, cập nhật AI prompt để AI gợi ý caption cho mỗi ảnh
- Lưu `{ url, caption }` thay vì chỉ URL

### 5. UI — Upload page

#### `apps/web/src/app/[locale]/admin/hdvh-upload/page.tsx`
- Mỗi ảnh preview hiển thị textarea caption bên dưới
- Gửi caption cùng ảnh trong FormData

#### `apps/web/src/app/[locale]/admin/projects-manager/[id]/page.tsx`
- Fix bug: images không được persist
- Thêm caption input cho mỗi ảnh
- Nút xoá ảnh (xoá cả storage)

#### `apps/web/src/app/[locale]/admin/projects-manager/[id]/preview/page.tsx`
- Hiển thị caption dưới mỗi ảnh

## Lưu ý

Việc **trích xuất ảnh từ file PDF/DOCX** là một bài toán phức tạp:

1. **PDF**: Cần dùng `pdf.js` hoặc `sharp` + `pdf2pic` — extract từng trang thành ảnh
2. **DOCX**: Cần dùng `mammoth` hoặc unzip docx → media folder

Do tính phức tạp và dung lượng thư viện, tôi đề xuất:
- **Phase 1 (này)**: Thêm caption cho ảnh upload thủ công + fix persist bug
- **Phase 2 (sau)**: Extract ảnh từ file PDF/DOCX tự động

## Verification

1. Upload HDVH + ảnh có caption → kiểm tra DB có lưu `{ url, caption }`
2. Vào Project Detail → thêm ảnh + caption → Save → refresh → còn đúng
3. Preview hiển thị caption dưới ảnh
