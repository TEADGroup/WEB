/**
 * Shared prompt templates for HDVH document parsing.
 *
 * All AI providers (OpenCode, OpenRouter, Ollama) use the same prompts so
 * output is consistent regardless of backend.  The prompts are designed to
 * work with the structural markers injected by extract.ts (## headings,
 * --- list items, === TABLES ===, ### [PAGE n] ###).
 */

// Backtick character — used inside template literals (TypeScript doesn't allow
// raw backticks inside template literal expressions in some configurations).
const BT = '`';

/** Language-specific labels. */
interface LangLabels {
  langName: string;
  langShort: 'vi' | 'en';
  systemDesc: string;
}

const VI: LangLabels = {
  langName: 'Vietnamese',
  langShort: 'vi',
  systemDesc:
    'Bạn là kỹ sư tự động hoá giàu kinh nghiệm, chuyên phân tích tài liệu Hướng dẫn Vận hành (HDVH) và Bảo trì (O&M Manuals). Nhiệm vụ của bạn là trích xuất chính xác cấu trúc dự án từ tài liệu.',
};

const EN: LangLabels = {
  langName: 'English',
  langShort: 'en',
  systemDesc:
    'You are an experienced industrial automation engineer specialising in analysing HDVH (Operation & Maintenance) manuals. Your task is to accurately extract the project structure from the document.',
};

// ---------------------------------------------------------------------------
// Helpers — build each section of the prompt without template-literal nesting
// ---------------------------------------------------------------------------

function buildFormattingInstructions(isVi: boolean): string {
  if (isVi) {
    return (
      'HƯỚNG DẪN ĐỊNH DẠNG:\n' +
      'Tài liệu được trích xuất với các marker cấu trúc sau. Hãy DỰA VÀO CÁC MARKER này để xác định sections:\n' +
      '- ' + BT + '## Tiêu đề ##' + BT + ' — tiêu đề section (heading)\n' +
      '- ' + BT + '--- nội dung' + BT + ' — mục trong danh sách (list item)\n' +
      '- ' + BT + '=== TABLE === ... === END TABLE ===' + BT + ' — bảng dữ liệu (ưu tiên trích xuất thông số kỹ thuật từ đây)\n' +
      '- ' + BT + '### [PAGE n] ###' + BT + ' — phân cách trang (giúp theo dõi flow tài liệu)\n' +
      '- ' + BT + '[HÌNH: img_0.png]' + BT + ' — vị trí hình ảnh trong tài liệu (ghi lại tên file vào image_names của section chứa nó)'
    );
  }
  return (
    'FORMATTING INSTRUCTIONS:\n' +
    'The extracted document uses these structural markers. USE THESE MARKERS to identify sections:\n' +
    '- ' + BT + '## Heading ##' + BT + ' — section heading\n' +
    '- ' + BT + '--- content' + BT + ' — list item\n' +
    '- ' + BT + '=== TABLE === ... === END TABLE ===' + BT + ' — data table (prioritise extracting technical specs from here)\n' +
    '- ' + BT + '### [PAGE n] ###' + BT + ' — page boundary (helps track document flow)\n' +
    '- ' + BT + '[HÌNH: img_0.png]' + BT + ' — image position in the document (record the filename in image_names of its containing section)'
  );
}

function buildProcessingPrinciples(isVi: boolean): string {
  if (isVi) {
    return (
      'NGUYÊN TẮC XỬ LÝ:\n' +
      '1. Các dòng bắt đầu bằng ' + BT + '##' + BT + ' gần như chắc chắn là heading của section\n' +
      '2. Nội dung ngay sau heading thuộc về section đó\n' +
      '3. Các dòng bắt đầu bằng ' + BT + '---' + BT + ' hoặc ' + BT + '-' + BT + ' là items trong list\n' +
      '4. Bảng dữ liệu liên quan đến thông số kỹ thuật nên được gán type="specs"\n' +
      '5. Mỗi section phải có nội dung đầy đủ bằng cả tiếng Việt và tiếng Anh\n' +
      '6. ' + BT + '[HÌNH: img_0.png]' + BT + ' là vị trí hình ảnh — ghi tên file vào image_names[] của section chứa nó\n' +
      '7. Nếu người dùng yêu cầu CHỈ lấy ảnh của section cụ thể, CHỈ liệt kê image_names cho section đó'
    );
  }
  return (
    'PROCESSING PRINCIPLES:\n' +
    '1. Lines starting with ' + BT + '##' + BT + ' are almost certainly section headings\n' +
    '2. Content immediately after a heading belongs to that section\n' +
    '3. Lines starting with ' + BT + '---' + BT + ' or ' + BT + '-' + BT + ' are list items\n' +
    '4. Tables with technical data should be assigned type="specs"\n' +
    '5. Every section must have full content in both Vietnamese and English\n' +
    '6. ' + BT + '[HÌNH: img_0.png]' + BT + ' is an image position — record the filename in image_names[] of its containing section\n' +
    '7. If the user asks to ONLY get images from a specific section, ONLY list image_names for that section'
  );
}

// ---------------------------------------------------------------------------
// System prompt — sent as the "system" role message
// ---------------------------------------------------------------------------

export function buildSystemPrompt(language: 'vi' | 'en'): string {
  const isVi = language === 'vi';
  const l = isVi ? VI : EN;

  return (
    l.systemDesc + '\n\n' +
    buildFormattingInstructions(isVi) + '\n\n' +
    buildProcessingPrinciples(isVi) + '\n\n' +
    (isVi
      ? '⚠️ RẤT QUAN TRỌNG: Bạn PHẢI trả lời bằng JSON. KHÔNG được thêm lời giải thích, hội thoại hay nội dung nào khác ngoài JSON. Nếu người dùng yêu cầu điều gì bằng ngôn ngữ tự nhiên, hãy diễn giải nó thành bộ lọc dữ liệu, KHÔNG trả lời như một cuộc trò chuyện.'
      : '⚠️ CRITICAL: You MUST respond with valid JSON only. Do NOT add explanations, conversational text, or any content outside the JSON object. If the user requests something in natural language, interpret it as a data filter — do NOT engage in conversation.')
  );
}

// ---------------------------------------------------------------------------
// Few-shot example
// ---------------------------------------------------------------------------

const FEW_SHOT_EXAMPLE =
  'Example 1:\n' +
  'Document text:\n' +
  '## Tổng quan hệ thống ##\n' +
  'Hệ thống băng tải phân loại sản phẩm tự động cho nhà máy sản xuất thực phẩm.\n' +
  '--- Công suất: 500 sản phẩm/phút\n' +
  '--- Kích thước: 20m x 1.5m\n' +
  '\n' +
  '## Danh mục thiết bị ##\n' +
  '--- PLC: Siemens S7-1200\n' +
  '--- Biến tần: Siemens G120C\n' +
  '--- Cảm biến: SICK\n' +
  '\n' +
  'Output:\n' +
  '{\n' +
  '  "sections": [\n' +
  '    {\n' +
  '      "type": "overview",\n' +
  '      "title_vi": "Tổng quan hệ thống",\n' +
  '      "title_en": "System overview",\n' +
  '      "content_vi": "Hệ thống băng tải phân loại sản phẩm tự động cho nhà máy sản xuất thực phẩm.",\n' +
  '      "content_en": "Automated product sorting conveyor system for a food manufacturing factory.",\n' +
  '      "items": ["Công suất: 500 sản phẩm/phút", "Kích thước: 20m x 1.5m"]\n' +
  '    },\n' +
  '    {\n' +
  '      "type": "equipment",\n' +
  '      "title_vi": "Danh mục thiết bị",\n' +
  '      "title_en": "Equipment list",\n' +
  '      "content_vi": "Danh sách thiết bị chính của hệ thống.",\n' +
  '      "content_en": "Main equipment list of the system.",\n' +
  '      "items": ["PLC: Siemens S7-1200", "Biến tần: Siemens G120C", "Cảm biến: SICK"]\n' +
  '    }\n' +
  '  ]\n' +
  '}\n' +
  '\n' +
  'Example 2:\n' +
  'Document text:\n' +
  '## Quy trình khởi động ##\n' +
  'Bước 1: Bật nguồn tủ điện\n' +
  'Bước 2: Kiểm tra đèn báo\n' +
  'Bước 3: Nhấn nút START\n' +
  '\n' +
  'Output:\n' +
  '{\n' +
  '  "sections": [\n' +
  '    {\n' +
  '      "type": "operating",\n' +
  '      "title_vi": "Quy trình khởi động",\n' +
  '      "title_en": "Startup procedure",\n' +
  '      "content_vi": "Các bước khởi động hệ thống.",\n' +
  '      "content_en": "System startup steps.",\n' +
  '      "items": ["Bước 1: Bật nguồn tủ điện", "Bước 2: Kiểm tra đèn báo", "Bước 3: Nhấn nút START"]\n' +
  '    }\n' +
  '  ]\n' +
  '}';

// ---------------------------------------------------------------------------
// Section type mapping table
// ---------------------------------------------------------------------------

function buildTypeTable(isVi: boolean): string {
  if (isVi) {
    return (
      'Section types (type — Ý nghĩa — Ví dụ nội dung):\n' +
      '- overview: Tổng quan hệ thống — Mô tả chung, sơ đồ khối, mục đích\n' +
      '- equipment: Danh mục thiết bị — PLC, HMI, biến tần, cảm biến, thiết bị đóng cắt\n' +
      '- specs: Thông số kỹ thuật — Bảng thông số, điện áp, dòng điện, công suất, kích thước\n' +
      '- operating: Quy trình vận hành — Các bước khởi động/vận hành/dừng, quy trình chuyển đổi\n' +
      '- maintenance: Quy trình bảo trì — Lịch bảo dưỡng, kiểm tra định kỳ, thay thế linh kiện\n' +
      '- safety: Cảnh báo an toàn — Cảnh báo nguy hiểm, yêu cầu an toàn, PPE\n' +
      '- other: Khác — Phụ lục, hình vẽ, danh sách bản vẽ'
    );
  }
  return (
    'Section types (type — Meaning — Content examples):\n' +
    '- overview: System overview — General description, block diagram, purpose\n' +
    '- equipment: Equipment list — PLC, HMI, VFD, sensors, switchgear\n' +
    '- specs: Technical specs — Parameter tables, voltage, current, power, dimensions\n' +
    '- operating: Operating procedures — Startup/operation/shutdown steps, changeover procedures\n' +
    '- maintenance: Maintenance — Maintenance schedule, periodic checks, part replacement\n' +
    '- safety: Safety — Hazard warnings, safety requirements, PPE\n' +
    '- other: Other — Appendix, drawings list, references'
  );
}

// ---------------------------------------------------------------------------
// Metadata extraction guidance
// ---------------------------------------------------------------------------

function buildMetadataGuidance(isVi: boolean): string {
  if (isVi) {
    return (
      'THÔNG TIN CẦN TRÍCH XUẤT:\n\n' +
      '1. project_title_vi / project_title_en — TÊN DỰ ÁN:\n' +
      '   Tìm trong phần đầu tài liệu. Có thể là tên hệ thống/dây chuyền/máy. Ví dụ: "Hệ thống băng tải phân loại sản phẩm", "Tủ điện điều khiển trạm bơm", "Hệ thống SCADA nhà máy nước". Nếu không có, bỏ trống.\n\n' +
      '2. client — KHÁCH HÀNG / CHỦ ĐẦU TƯ:\n' +
      '   Tìm trong phần đầu tài liệu hoặc trang bìa. Thường có các từ khoá:\n' +
      '   - "Công ty TNHH...", "Công ty CP...", "Công ty Cổ phần...", "Cty...", "Chủ đầu tư:"\n' +
      '   - Hoặc địa chỉ công ty kèm tên. Nếu không rõ ràng, bỏ trống.\n\n' +
      '3. location — ĐỊA ĐIỂM LẮP ĐẶT:\n' +
      '   Tìm trong tài liệu. Thường là tỉnh/thành phố ở Việt Nam:\n' +
      '   - "Tỉnh Bình Dương", "Đồng Nai", "TP. Hồ Chí Minh", "Long An", "Bà Rịa - Vũng Tàu", "Hà Nội", "Đà Nẵng", "Hải Phòng"...\n' +
      '   - Có thể xuất hiện trong địa chỉ nhà máy. Nếu không có, bỏ trống.\n\n' +
      '4. summary_vi / summary_en — TÓM TẮT:\n' +
      '   Viết 1-2 câu tóm tắt về hệ thống: mục đích, phạm vi, công nghệ sử dụng.\n\n' +
      '5. sections — CÁC MỤC NỘI DUNG CHÍNH:\n' +
      '   Dựa vào các marker (## heading ##, === TABLE ===) xác định section. Mỗi section:\n' +
      '   - type: chọn LOẠI PHÙ HỢP NHẤT (chỉ 1 loại, không dùng |)\n' +
      '   - title_vi + title_en: tiêu đề song ngữ\n' +
      '   - content_vi + content_en: nội dung CHI TIẾT, bao gồm giải thích\n' +
      '   - items[]: các điểm chính dạng bullet list (mỗi item là string)'
    );
  }
  return (
    'INFORMATION TO EXTRACT:\n\n' +
    '1. project_title_vi / project_title_en — PROJECT NAME:\n' +
    '   Look in the document header. Could be the system/line/machine name. E.g. "Product sorting conveyor system", "Pump station control panel", "Water plant SCADA system". Leave empty if absent.\n\n' +
    '2. client — CLIENT / INVESTOR:\n' +
    '   Look in the document header or cover page. Common keywords:\n' +
    '   - "Company Limited", "Joint Stock Company", "Investor:"\n' +
    '   - Or company address with name. Leave empty if unclear.\n\n' +
    '3. location — INSTALLATION LOCATION:\n' +
    '   Look in the document. Usually a province/city in Vietnam:\n' +
    '   - "Binh Duong province", "Dong Nai", "Ho Chi Minh City", "Long An", "Ba Ria - Vung Tau"...\n' +
    '   - May appear in the factory address. Leave empty if absent.\n\n' +
    '4. summary_vi / summary_en — SUMMARY:\n' +
    '   Write 1-2 sentences summarising the system: purpose, scope, technology used.\n\n' +
    '5. sections — MAIN CONTENT SECTIONS:\n' +
    '   Use the structural markers (## heading ##, === TABLE ===) to identify sections. Each section:\n' +
    '   - type: pick the BEST MATCH (1 type only, no pipes)\n' +
    '   - title_vi + title_en: bilingual titles\n' +
    '   - content_vi + content_en: DETAILED content including explanations\n' +
    '   - items[]: key points as bullet list (each item MUST be a STRING, NOT an object)'
  );
}

// ---------------------------------------------------------------------------
// User prompt — the actual extraction instruction sent with the document text
// ---------------------------------------------------------------------------

export function buildUserPrompt(
  text: string,
  language: 'vi' | 'en',
  maxTokens = 8000,
  customPrompt?: string,
): string {
  const isVi = language === 'vi';
  const maxChars = maxTokens * 4;
  const body = text.length > maxChars ? text.slice(0, maxChars) : text;

  const header = isVi
    ? 'Phân tích tài liệu HDVH (Hướng dẫn Vận hành) sau đây và trích xuất thông tin có cấu trúc bằng tiếng Việt.'
    : 'Analyse the following HDVH (Operation & Maintenance Manual) document and extract structured information in English.';

  const importantNotes = isVi
    ? (
      'LƯU Ý QUAN TRỌNG:\n' +
      '- Luôn luôn điền content_vi và content_en ĐẦY ĐỦ, bao gồm giải thích và mô tả\n' +
      '- Nếu tài liệu chỉ có tiếng Việt, hãy dịch nội dung sang tiếng Anh thật sát nghĩa\n' +
      '- KHÔNG thêm section type nào không có trong danh sách (overview|equipment|specs|operating|maintenance|safety|other)\n' +
      '- items[] là mảng STRING, KHÔNG phải mảng object\n' +
      '- Giữ nguyên văn bản gốc tiếng Việt — chỉ chuẩn hoá chính tả nếu có lỗi rõ ràng\n' +
      '- Trích xuất TẤT CẢ các sections, không bỏ sót'
    )
    : (
      'IMPORTANT NOTES:\n' +
      '- Always fill content_vi and content_en THOROUGHLY with explanations and descriptions\n' +
      '- If the document is only in Vietnamese, translate the content to English accurately\n' +
      '- DO NOT add section types outside the list (overview|equipment|specs|operating|maintenance|safety|other)\n' +
      '- items[] is an array of STRINGS, NOT objects\n' +
      '- Preserve the original Vietnamese text — only correct spelling if there are clear errors\n' +
      '- Extract ALL sections, do not skip any'
    );

  const outputFormat = isVi
    ? (
      'ĐỊNH DẠNG ĐẦU RA JSON:\n' +
      '{\n' +
      '  "project_title_vi": "tên dự án (hoặc bỏ trống)",\n' +
      '  "project_title_en": "project name (or empty)",\n' +
      '  "client": "tên khách hàng (hoặc bỏ trống)",\n' +
      '  "location": "địa điểm (hoặc bỏ trống)",\n' +
      '  "summary_vi": "tóm tắt 1-2 câu",\n' +
      '  "summary_en": "1-2 sentence summary",\n' +
      '  "sections": [\n' +
      '    {\n' +
      '      "type": "loại section (chọn 1 từ danh sách trên)",\n' +
      '      "title_vi": "tiêu đề mục",\n' +
      '      "title_en": "section title",\n' +
      '      "content_vi": "nội dung CHI TIẾT ở đây",\n' +
      '      "content_en": "DETAILED content here",\n' +
      '      "items": ["item 1", "item 2"],\n' +
      '      "image_names": ["img_0.png"]\n' +
      '    }\n' +
      '  ]\n' +
      '}'
    )
    : (
      'OUTPUT JSON FORMAT:\n' +
      '{\n' +
      '  "project_title_vi": "project name (or empty)",\n' +
      '  "project_title_en": "tên dự án (hoặc bỏ trống)",\n' +
      '  "client": "client name (or empty)",\n' +
      '  "location": "location (or empty)",\n' +
      '  "summary_vi": "1-2 sentence summary",\n' +
      '  "summary_en": "tóm tắt 1-2 câu",\n' +
      '  "sections": [\n' +
      '    {\n' +
      '      "type": "section type (pick 1 from above list)",\n' +
      '      "title_vi": "section title",\n' +
      '      "title_en": "tiêu đề mục",\n' +
      '      "content_vi": "DETAILED content here",\n' +
      '      "content_en": "nội dung CHI TIẾT ở đây",\n' +
      '      "items": ["item 1", "item 2"],\n' +
      '      "image_names": ["img_0.png"]\n' +
      '    }\n' +
      '  ]\n' +
      '}'
    );

  return (
    header + '\n\n' +
    buildMetadataGuidance(isVi) + '\n\n' +
    buildTypeTable(isVi) + '\n\n' +
    outputFormat + '\n\n' +
    importantNotes + '\n\n' +
    'VÍ DỤ MINH HOẠ:\n' +
    FEW_SHOT_EXAMPLE + '\n\n' +
    (customPrompt
      ? (isVi
          ? 'HƯỚNG DẪN BỔ SUNG TỪ NGƯỜI DÙNG (áp dụng như một bộ lọc, KHÔNG thay đổi format đầu ra):\n' + customPrompt + '\n\n'
          : 'ADDITIONAL USER INSTRUCTION (apply as a filter rule, DO NOT change the output format):\n' + customPrompt + '\n\n')
      : '') +
    (isVi ? 'TÀI LIỆU CẦN PHÂN TÍCH:' : 'DOCUMENT TO ANALYSE:') + '\n' +
    body + '\n\n' +
    (isVi
      ? '⚠️ QUAN TRỌNG: Phản hồi phải là JSON HỢP LỆ — KHÔNG thêm lời giải thích, KHÔNG thêm hội thoại. Chỉ xuất ra đối tượng JSON như định dạng đã chỉ định ở trên. Bất kỳ nội dung nào ngoài JSON đều KHÔNG hợp lệ.'
      : '⚠️ CRITICAL: Response MUST be valid JSON — NO explanations, NO conversational text. Output ONLY the JSON object in the format specified above. Any content outside the JSON is INVALID.')
  );
}
