# 🤖 AI HDVH PARSER FEATURE - IMPLEMENTATION PLAN

## 📋 FEATURE OVERVIEW

**Mục tiêu**: Tự động phân tích Hướng dẫn vận hành (HDVH) và tạo project structure tree sử dụng AI.

**Workflow**:
1. Upload HDVH documents (PDF, images)
2. AI phân tích nội dung và hình ảnh
3. Tự động tạo project structure tree
4. Admin có thể edit và refine kết quả

---

## 🎯 PHASE 1: UI DESIGN & UPLOAD INTERFACE

### 1.1 HDVH Upload Page Design
**Location**: `/admin/hdvh-upload`

**Components**:
- **Upload Zone**: Drag & drop interface cho files
- **File List**: Hiển thị files đã upload với status
- **Progress Indicators**: Upload progress và parsing progress
- **Preview**: Preview documents trước khi parse

**Features**:
- Support multiple file types: PDF, Images (PNG, JPG)
- File size limits và validation
- Upload progress bars
- Error handling

### 1.2 Project Creation Form Integration
- **Basic Info**: Project name, description, category
- **HDVH Upload**: Attach documents to project
- **AI Settings**: Parser options (accuracy vs speed)

---

## 🤖 PHASE 2: AI PARSER IMPLEMENTATION

### 2.1 Backend API Structure

**New API Routes**:
```
/api/hdvh-parser/upload   - Upload và store documents
/api/hdvh-parser/parse    - Parse documents with AI
/api/hdvh-parser/status   - Check parsing status
/api/projects/create      - Create project from parsed data
```

### 2.2 AI Analysis Pipeline

**Stage 1: Document Processing**
- Extract text từ PDF (mammoth/pdf-parse)
- Extract images từ documents
- Preprocess data cho AI

**Stage 2: AI Analysis**
- Use Anthropic Claude API
- Analyze document structure
- Extract project hierarchy
- Identify sections và subsections
- Extract technical specifications

**Stage 3: Tree Generation**
- Convert AI output thành project structure
- Create parent-child relationships
- Assign metadata và types

### 2.3 Data Models

```typescript
interface HDVHDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  fileSize: number;
  uploadedAt: Date;
  parsedAt?: Date;
  status: 'uploading' | 'uploaded' | 'parsing' | 'parsed' | 'error';
  url?: string;
}

interface ParsedProjectStructure {
  projectName: string;
  description: string;
  category: string;
  sections: ProjectSection[];
  metadata: {
    confidence: number;
    processingTime: number;
    aiModel: string;
  };
}

interface ProjectSection {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  content: string;
  type: 'chapter' | 'section' | 'subsection' | 'specification';
  order: number;
  children: ProjectSection[];
}
```

---

## 🎨 PHASE 3: PROJECT TREE VISUALIZATION

### 3.1 React Flow Integration

**Location**: `/admin/projects-manager/[id]/structure`

**Components**:
- **Interactive Tree**: React Flow với customizable nodes
- **Drag & Drop**: Reorganize sections
- **Add/Edit/Delete**: CRUD operations
- **Zoom/Pan**: Navigate large structures

**Features**:
- Visual hierarchy indicators
- Search và filter
- Export structure (JSON, PDF)
- Import structure

### 3.2 Node Types

```typescript
const nodeTypes = {
  root: RootNode,          // Project root
  chapter: ChapterNode,    // Main chapters
  section: SectionNode,    // Sections
  spec: SpecNode,         // Technical specs
  image: ImageNode,       // Image references
}
```

---

## 📊 PHASE 4: ADMIN INTERFACE ENHANCEMENTS

### 4.1 Enhanced Projects Manager
- **New Project**: HDVH upload integration
- **Project List**: Show AI parsing status
- **Quick Actions**: Parse, re-parse, export

### 4.2 Project Detail Page
- **Structure Tab**: Interactive tree view
- **Content Tab**: Edit content
- **Settings Tab**: Parser configuration

### 4.3 Real-time Updates
- WebSocket updates cho parsing progress
- Live preview của tree generation
- Error notifications

---

## 🔧 PHASE 5: TECHNICAL IMPLEMENTATION

### 5.1 File Upload Handler

```typescript
// app/api/hdvh-upload/route.ts
export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll('files');

  // Validate files
  // Store in Supabase Storage
  // Return file metadata
}
```

### 5.2 AI Parser Service

```typescript
// lib/anthropic/hdvh-parser.ts
export async function parseHDVHDocument(file: File) {
  // Extract content from file
  // Call Anthropic API with structured output
  // Return parsed project structure
}

export async function parseHDVHImage(imageBase64: string) {
  // Analyze image with Claude Vision
  // Extract text và diagrams
  // Return structured data
}
```

### 5.3 Project Creation Service

```typescript
// lib/services/project-creator.ts
export async function createProjectFromParsedData(
  data: ParsedProjectStructure
) {
  // Create project in database
  // Create sections hierarchically
  // Upload images to storage
  // Return project ID
}
```

---

## 🎯 SUCCESS METRICS

### User Experience
- [ ] Upload process < 30 seconds cho 10MB file
- [ ] Parsing complete trong < 2 minutes cho 50 pages
- [ ] Interactive tree loads < 1 second
- [ ] Real-time progress updates

### Accuracy
- [ ] Structure extraction accuracy > 85%
- [ ] Section titles correctly identified > 90%
- [ ] Technical specs preserved > 80%

### Performance
- [ ] Support files up to 50MB
- [ ] Handle documents up to 200 pages
- [ ] Process multiple files concurrently

---

## 🚀 IMPLEMENTATION PRIORITY

### Sprint 1: Core Upload (2-3 days)
- Upload interface
- File storage
- Basic progress indicators

### Sprint 2: AI Parser (3-4 days)
- Anthropic integration
- PDF/image processing
- Basic structure extraction

### Sprint 3: Project Tree (2-3 days)
- React Flow integration
- Interactive nodes
- CRUD operations

### Sprint 4: Polish (2 days)
- Error handling
- Real-time updates
- Performance optimization

---

**Next Steps**: Implement Sprint 1 - Core Upload Interface

---

*Created: 2026-07-22*
*Status: Ready for Implementation*