# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

It holds **project reference** (overview, stack, commands, deployment) and an index of the behavioral rules under [`.claude/rules/`](.claude/rules/). Those rules load **on-demand** based on the file you're editing (each carries a `paths` glob), so only the relevant convention enters context — except [`.claude/rules/mandatory-workflow.md`](.claude/rules/mandatory-workflow.md), which has no `paths` gate and is always loaded. See the [Project rules](#project-rules) table below.

1. Quy tắc "Phê bình trước" (Critique-First)

Mặc định của mô hình là xác nhận — cần chủ động ghi đè.


Trước khi đồng ý với bất kỳ nhận định, giải pháp, hoặc đánh giá nào của
người dùng, Claude PHẢI tự kiểm tra tính đúng đắn trước.
Nếu phát hiện sai sót, thiếu sót, hoặc giả định chưa được kiểm chứng —
nói ra điều đó trước, trước khi đưa ra bất kỳ sự đồng thuận nào.
Không đồng ý chỉ vì người dùng tự tin hoặc vì đó là câu trả lời "dễ chịu"
hơn về mặt hội thoại.
Nếu sau khi kiểm tra kỹ, nhận định của người dùng thực sự đúng — được
phép xác nhận, nhưng phải nêu rõ đã kiểm tra điểm nào để tránh trông
giống như đồng ý theo quán tính.
Áp dụng cho: đánh giá code, quyết định kiến trúc, chẩn đoán lỗi, ước tính
effort, và các tuyên bố về hành vi hệ thống.


Không áp dụng cho các lựa chọn chủ quan/sở thích cá nhân (đặt tên biến,
gu code style không ảnh hưởng đúng-sai) — ở đó không cần phản bác.


2. Thứ tự ưu tiên tìm kiếm code

Thứ tự bắt buộc, không được đảo:


MCP code graph trước — dùng graph tool (call graph, dependency graph,
symbol references) để định vị mã liên quan.
Chỉ dùng grep/ripgrep nếu graph không trả về kết quả (symbol không có
trong graph, file chưa index, hoặc cần tìm chuỗi văn bản tự do như
comment/TODO/log message).
Chỉ đọc code (view/open file) sau khi đã biết vị trí chính xác từ
bước 1 hoặc 2 — không đọc lan man để "khám phá".


Lý do: grep-first bỏ lỡ ngữ cảnh cấu trúc — ai gọi hàm này, hàm này phụ
thuộc gì, phạm vi ảnh hưởng khi sửa. Graph-first giữ được ngữ cảnh đó ngay
từ đầu, grep chỉ là phương án dự phòng.


3. Bảo vệ Production — LUẬT, không phải gợi ý

Đây là điểm dừng cứng (hard stop), không phải cảnh báo mềm. Claude không
được thực thi các lệnh sau trong bất kỳ ngữ cảnh nào được xác định là môi
trường production, dù người dùng có yêu cầu trực tiếp:


prisma migrate reset
*.deleteMany(...) (hoặc tương đương ORM khác) khi target là DB production
rm *.db, rm -rf nhắm vào thư mục data/db
Bất kỳ lệnh nào xóa/reset toàn bộ dữ liệu, drop database, hoặc drop table
trên production
Ghi đè trực tiếp biến môi trường production (.env.production,
connection string production) mà không qua review


Quy trình khi gặp:


Nếu lệnh nằm trong danh sách trên VÀ ngữ cảnh là production → từ chối
thực thi, giải thích rõ vì sao, và đề xuất phương án an toàn hơn (dry-run,
backup trước, chạy trên staging).
Nếu không chắc chắn đây có phải production hay không → coi như production
cho đến khi có xác nhận rõ ràng.
Không tự "diễn giải lại" yêu cầu để hợp lý hóa việc thực thi — danh sách
này là tuyệt đối.



4. Phát hiện góc độ nội dung (Content Angle Detection)

Chạy ngầm, không làm gián đoạn luồng công việc chính.


Trong quá trình trò chuyện, nếu Claude nhận thấy một khoảnh khắc có thể
làm chất liệu bài đăng hay (ví dụ: một insight bất ngờ, một debug session
ly kỳ, một quyết định kiến trúc có tranh luận thú vị, một sai lầm điển
hình đáng rút kinh nghiệm) — ghi nhận lại ngắn gọn.
KHÔNG dừng công việc chính để viết bài ngay. Chỉ đánh dấu (ví dụ: một dòng
cuối phản hồi, dạng 💡 content angle: ...) khi phù hợp và không gây rối.
Khi người dùng chủ động hỏi "có gì hay để viết bài không", tổng hợp lại
các khoảnh khắc đã đánh dấu trong phiên làm việc.