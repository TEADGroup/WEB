'use client';

import { useState, useRef, useCallback } from 'react';
import { Image, Link, Upload, X, Loader2, Check, AlertCircle } from 'lucide-react';

/* ─── Types ─── */
export interface ImageItem {
  url: string;
  caption?: string;
}

interface ImageUploadProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  /** Title shown above the upload zone */
  title?: string;
  /** Subtitle / hint */
  subtitle?: string;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Accepted MIME types */
  accept?: string;
  /** Allow URL input in addition to file upload */
  allowUrl?: boolean;
  /** Show caption fields */
  showCaption?: boolean;
}

/* ══════════════════════════════════════════════════════════
 * ImageUpload — file upload OR paste URL
 *
 * Props:
 *   images: ImageItem[]
 *   onChange: (images: ImageItem[]) => void
 *   allowUrl?: boolean  (default true)
 *   showCaption?: boolean (default false)
 *
 * Usage:
 *   <ImageUpload images={projectImages} onChange={setProjectImages} />
 *   <ImageUpload images={[{url: logoUrl}]} onChange={setLogo}
 *     title="Company Logo" showCaption={false} allowUrl={true} />
 ══════════════════════════════════════════════════════════ */
export function ImageUpload({
  images,
  onChange,
  title = 'Hình ảnh',
  subtitle = 'Tải lên từ file hoặc dán URL ảnh',
  maxSizeMB = 5,
  accept = 'image/*',
  allowUrl = true,
  showCaption = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─── File upload ─── */
  const handleFile = useCallback(async (file: File) => {
    /* Validate */
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File quá lớn. Tối đa ${maxSizeMB}MB.`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, SVG).');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'project-images');
      formData.append('projectId', 'temp'); // server cần projectId, fallback nếu chưa có

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      onChange([...images, { url: data.publicUrl, caption: '' }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  }, [images, onChange, maxSizeMB]);

  /* ─── URL paste ─── */
  const handleUrlAdd = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try { new URL(trimmed); } catch {
      setError('URL không hợp lệ. Vui lòng dán URL đầy đủ (https://...).');
      return;
    }

    setError(null);
    onChange([...images, { url: trimmed, caption: '' }]);
    setUrlInput('');
    setShowUrlInput(false);
  }, [urlInput, images, onChange]);

  /* ─── Remove image ─── */
  const handleRemove = useCallback((index: number) => {
    onChange(images.filter((_, i) => i !== index));
  }, [images, onChange]);

  /* ─── Update caption ─── */
  const handleCaption = useCallback((index: number, caption: string) => {
    const updated = images.map((img, i) => (i === index ? { ...img, caption } : img));
    onChange(updated);
  }, [images, onChange]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image size={18} className="text-brand-blue" />
          <span className="text-sm font-semibold text-slate-700">{title}</span>
        </div>
        <span className="text-xs text-slate-400">{images.length} ảnh</span>
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 -mt-2">{subtitle}</p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-600">
          <AlertCircle size={14} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Grid hiển thị ảnh */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={i} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white/60">
              {/* Image preview */}
              <div className="aspect-square overflow-hidden bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption || `Image ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23ddd"><rect width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%23999">Lỗi</text></svg>'; }}
                />
              </div>

              {/* Caption */}
              {showCaption && (
                <input
                  type="text"
                  value={img.caption || ''}
                  onChange={(e) => handleCaption(i, e.target.value)}
                  placeholder="Chú thích..."
                  className="w-full border-t border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 placeholder:text-slate-300 focus:outline-none"
                />
              )}

              {/* Delete overlay */}
              <button
                onClick={() => handleRemove(i)}
                className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-400 shadow-sm opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Upload file */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl border border-dashed border-brand-blue/30 bg-brand-blue/[0.03] px-4 py-2.5 text-xs font-semibold text-brand-blue transition-all hover:border-brand-blue/60 hover:bg-brand-blue/[0.06] disabled:opacity-50"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Đang tải...' : 'Tải lên từ máy'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        {/* URL input */}
        {allowUrl && (
          showUrlInput ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/60 px-3 py-2 focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/20">
                <Link size={14} className="text-slate-400 shrink-0" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none"
                />
              </div>
              <button
                onClick={handleUrlAdd}
                disabled={!urlInput.trim()}
                className="shrink-0 rounded-xl bg-brand-blue px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-brand-blue/90 disabled:opacity-50"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                className="shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowUrlInput(true)}
              className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/40 px-4 py-2.5 text-xs font-semibold text-slate-500 transition-all hover:border-slate-400 hover:text-slate-700"
            >
              <Link size={15} />
              Dán URL ảnh
            </button>
          )
        )}
      </div>

      {/* Hint */}
      {images.length === 0 && !uploading && (
        <p className="text-xs text-slate-300 text-center py-4">
          Chưa có ảnh nào. Tải lên từ máy hoặc dán URL ảnh bên trên.
        </p>
      )}
    </div>
  );
}
