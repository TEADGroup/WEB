'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, FileSpreadsheet, FileImage,
  Loader2, CheckCircle, XCircle, Sparkles,
  ArrowRight, AlertTriangle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StepState = 'idle' | 'active' | 'done' | 'error';

interface ProgressStep {
  key: string;
  label: string;
  state: StepState;
}

// ---------------------------------------------------------------------------
// Acceptable MIME types & extensions
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
];

const ACCEPT_STRING = '.pdf,.docx,.xlsx,.png,.jpg,.jpeg';

const SUPPORTED_FORMATS = [
  { ext: 'PDF', icon: FileText },
  { ext: 'DOCX', icon: FileText },
  { ext: 'XLSX', icon: FileSpreadsheet },
  { ext: 'PNG', icon: FileImage },
  { ext: 'JPG', icon: FileImage },
];

// ---------------------------------------------------------------------------
// Progress stepper labels
// ---------------------------------------------------------------------------

const STEP_LABELS = [
  '📤 Uploading file…',
  '🔍 Extracting content…',
  '🤖 AI đang phân tích…',
  '🏗️ Creating project…',
  '✅ Hoàn tất',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HdvhUploadPage() {
  const t = useTranslations('Admin');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  // Submission state
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<{
    projectId?: string;
    projectTitle?: string;
    error?: string;
  }>({});

  // -----------------------------------------------------------------------
  // File handler
  // -----------------------------------------------------------------------

  const acceptFile = useCallback((f: File) => {
    // Validate type by extension for cases where MIME is wrong
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg'];
    if (!ACCEPTED_TYPES.includes(f.type) && !validExts.includes(ext)) {
      setResult({ error: `Unsupported file type: ${f.type || ext}.` });
      setPhase('error');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setResult({ error: 'File exceeds 50 MB limit.' });
      setPhase('error');
      return;
    }
    setFile(f);
    setPhase('idle');
    setResult({});
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }, [acceptFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    // Reset so re-selecting the same file triggers the event
    e.target.value = '';
  }, [acceptFile]);

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  const handleSubmit = async () => {
    if (!file || phase === 'uploading') return;

    setPhase('uploading');
    setCurrentStep(0);
    setResult({});

    // Animate through progress steps while the blocking API runs
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, STEP_LABELS.length - 1));
    }, 4000);

    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      if (customPrompt.trim()) fd.append('customPrompt', customPrompt.trim());

      const res = await fetch('/api/hdvh-parser/auto-create', {
        method: 'POST',
        body: fd,
      });

      clearInterval(stepInterval);
      setCurrentStep(STEP_LABELS.length - 1); // done

      const data = await res.json();

      if (data.success && data.project?.id) {
        setPhase('success');
        setResult({
          projectId: data.project.id,
          projectTitle: data.project.title || file.name,
        });
      } else {
        setPhase('error');
        setResult({ error: data.error || 'Unknown error from server.' });
      }
    } catch (err) {
      clearInterval(stepInterval);
      setPhase('error');
      setResult({ error: err instanceof Error ? err.message : 'Network error.' });
    }
  };

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------

  const handleReset = () => {
    setFile(null);
    setCustomPrompt('');
    setPhase('idle');
    setCurrentStep(0);
    setResult({});
  };

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col min-h-0 space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan">
          AI HDVH Parser
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
          Upload → AI phân tích → Tự động tạo dự án
        </p>
      </div>

      {/* ──────────────────────── Main card ──────────────────────── */}
      <div className="rounded-2xl bg-white/40 backdrop-blur-xl border border-white/20 shadow-premium p-4 sm:p-6 space-y-6">

        {/* ============================================================
            PHASE: IDLE / SUCCESS / ERROR
            ============================================================ */}
        <AnimatePresence mode="wait">
          {phase === 'success' && result.projectId ? (
            /* ── Success result ─────────────────────────────────── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center py-10 gap-4"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-200">
                <CheckCircle size={40} className="text-white" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-emerald-800">
                  Dự án đã tạo thành công!
                </h2>
                <p className="text-emerald-600 text-sm mt-1">
                  AI đã phân tích <strong className="font-semibold">{file?.name}</strong> và tạo cấu trúc dự án.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <a
                  href={`./projects-manager/${result.projectId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-all hover:scale-[1.03] active:scale-[0.97]"
                >
                  📂 Open Project
                  <ArrowRight size={16} />
                </a>
                <button
                  onClick={handleReset}
                  className="rounded-xl bg-white/70 px-5 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-black/[0.06] transition-all hover:bg-white hover:shadow-sm"
                >
                  Parse another
                </button>
              </div>
            </motion.div>
          ) : phase === 'error' ? (
            /* ── Error result ───────────────────────────────────── */
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center py-10 gap-4"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-orange-500 shadow-lg shadow-red-200">
                <XCircle size={40} className="text-white" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-red-800">
                  Phân tích thất bại
                </h2>
                <p className="text-red-600 text-sm mt-1 max-w-md">
                  {result.error || 'An unexpected error occurred.'}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-all hover:scale-[1.03] active:scale-[0.97]"
                >
                  🔄 Retry
                </button>
              </div>
            </motion.div>
          ) : phase === 'uploading' ? (
            /* ── Progress stepper ───────────────────────────────── */
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 px-2"
            >
              <div className="space-y-4 max-w-lg mx-auto">
                {STEP_LABELS.map((label, i) => {
                  let state: 'done' | 'active' | 'pending';
                  if (i < currentStep) state = 'done';
                  else if (i === currentStep) state = 'active';
                  else state = 'pending';

                  return (
                    <div key={i} className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                        state === 'done'
                          ? 'bg-emerald-500 text-white'
                          : state === 'active'
                          ? 'bg-gradient-to-r from-brand-cyan to-brand-blue text-white shadow-lg shadow-brand-blue/20'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {state === 'done' ? (
                          <CheckCircle size={16} />
                        ) : state === 'active' ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <span className="text-xs">{i + 1}</span>
                        )}
                      </div>
                      {/* Label */}
                      <span className={`text-sm transition-all ${
                        state === 'done'
                          ? 'text-emerald-700 font-medium'
                          : state === 'active'
                          ? 'text-slate-800 font-semibold'
                          : 'text-slate-400'
                      }`}>
                        {label}
                        {state === 'active' && (
                          <span className="inline-flex ml-1.5 gap-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-blue/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-blue/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-blue/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* ── Upload form (idle) ─────────────────────────────── */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Upload zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                  dragOver
                    ? 'border-brand-blue bg-brand-blue/5 scale-[1.01]'
                    : file
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-brand-blue/40 bg-white/30'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT_STRING}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100">
                      <FileText size={28} className="text-emerald-600" />
                    </div>
                    <p className="font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-500 hover:text-red-700 underline mt-1"
                    >
                      Remove & choose another
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-cyan/10">
                      <Upload size={32} className="text-brand-blue" />
                    </div>
                    <div>
                      <p className="font-display text-base font-semibold text-slate-800">
                        Drop file here or click to browse
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Maximum file size: 50 MB
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      {SUPPORTED_FORMATS.map(({ ext, icon: Icon }) => (
                        <span
                          key={ext}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500"
                        >
                          <Icon size={12} />
                          {ext}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom instruction */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-blue" />
                    {t('customPrompt')}
                    <span className="text-xs text-slate-400 font-normal">(optional)</span>
                  </span>
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={t('customPromptHint')}
                  rows={2}
                  className="w-full rounded-xl border border-black/[0.07] bg-white/70 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-blue/30 focus:shadow-md resize-none"
                />
              </div>

              {/* Start AI button */}
              <button
                onClick={handleSubmit}
                disabled={!file}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
              >
                <Sparkles size={18} />
                🚀 Start AI Analysis
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ──────────────────────── Guide footer ──────────────────────── */}
      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-brand-blue/5 to-brand-cyan/5 p-4 border border-brand-blue/10"
        >
          <div className="grid gap-3 sm:grid-cols-3 text-center text-xs">
            <div className="p-2">
              <span className="block text-lg mb-1">📤</span>
              <strong>Upload file</strong>
              <br />
              <span className="text-slate-400">PDF, DOCX, XLSX, images</span>
            </div>
            <div className="p-2">
              <span className="block text-lg mb-1">📝</span>
              <strong>AI hướng dẫn (tuỳ chọn)</strong>
              <br />
              <span className="text-slate-400">VD: "Tập trung thông số PLC"</span>
            </div>
            <div className="p-2">
              <span className="block text-lg mb-1">🤖</span>
              <strong>AI tự động</strong>
              <br />
              <span className="text-slate-400">Phân tích → Tạo project</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
