'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, File, X, CheckCircle, AlertCircle, Loader2,
  FileText, Image as ImageIcon, Brain, Cpu, BookText, Sparkles
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'parsing' | 'parsed' | 'error';
  progress: number;
  error?: string;
  path?: string;
  url?: string;
}

type AiProvider = 'claude' | 'openai' | 'ollama';

interface HDVHUploadProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  onParseComplete?: (result: {
    success: boolean;
    projectId?: string;
    filesCount?: number;
    error?: string;
  }) => void;
}

// AI Providers configuration
const AI_PROVIDERS: { id: AiProvider; name: string; icon: typeof Brain; description: string; color: string }[] = [
  { id: 'claude', name: 'Claude (Anthropic)', icon: Brain, description: 'Best for document analysis & structure extraction', color: 'from-purple-500 to-pink-500' },
  { id: 'openai', name: 'OpenAI (GPT-4o)', icon: Cpu, description: 'Fast analysis with vision capabilities', color: 'from-emerald-500 to-teal-500' },
  { id: 'ollama', name: 'Ollama (Local)', icon: BookText, description: 'Local processing, no API key needed', color: 'from-orange-500 to-amber-500' },
];

export function HDVHUpload({ onFilesChange, onParseComplete }: HDVHUploadProps) {
  const t = useTranslations('Admin');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Notify parent when files change
  useEffect(() => {
    // Filter out loading/parsing files for the count
    onFilesChange?.(files.filter(f => f.status !== 'uploading' && f.status !== 'parsing'));
  }, [files]);
  const [aiProvider, setAiProvider] = useState<AiProvider>('claude');
  const [parseMode, setParseMode] = useState<'auto' | 'structure' | 'specs'>('auto');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  }, []);

  const processFiles = async (fileList: File[]) => {
    setIsUploading(true);

    const newFiles: UploadedFile[] = fileList.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png'),
      status: 'uploading',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // REAL upload to API
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append('files', file, file.name);
    });

    try {
      const xhr = new XMLHttpRequest();

      // Upload via POST
      const res = await fetch('/api/hdvh-parser/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed: ' + (await res.text()));
      }

      const data = await res.json();

      if (data.success && data.files) {
        // Update files with real paths from server
        setFiles((prev) =>
          prev.map((f) => {
            const uploaded = data.files.find((uf: any) => uf.name === f.name);
            return {
              ...f,
              status: 'uploaded',
              progress: 100,
              path: uploaded?.path || f.path,
              url: uploaded?.url || f.url,
            };
          })
        );
      } else {
        throw new Error('Upload response invalid');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error', error: errorMsg }))
      );
    }

    setIsUploading(false);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const startParsing = async () => {
    const uploadedFiles = files.filter((f) => f.status === 'uploaded');
    if (uploadedFiles.length === 0) return;

    // Mark all as parsing
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'uploaded' ? { ...f, status: 'parsing', progress: 0 } : f
      )
    );

    try {
      // Call AI parsing API with selected provider
      const response = await fetch('/api/hdvh-parser/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: uploadedFiles.map((f) => ({
            id: f.id,
            name: f.name,
            path: f.path || f.name,
            url: f.url || '',
          })),
          options: {
            accuracy: 'balanced',
            includeImages: true,
            provider: aiProvider,
            mode: parseMode,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.projectId) {
        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: 'parsed', progress: 100 }))
        );
        onParseComplete?.({
          success: true,
          projectId: data.projectId,
          filesCount: uploadedFiles.length,
        });
      } else {
        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: 'error', error: data.error || 'Parse failed' }))
        );
        onParseComplete?.({ success: false, error: data.error || 'Unknown error occurred' });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to parsing service';
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error', error: errorMsg }))
      );
      onParseComplete?.({ success: false, error: errorMsg });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText size={20} />;
    if (type.includes('image')) return <ImageIcon size={20} />;
    return <File size={20} />;
  };

  return (
    <div className="space-y-6">
      {/* AI Provider Selector */}
      <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-6 border border-white/20 shadow-premium">
        <h3 className="font-display text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-brand-blue" />
          AI Analysis Configuration
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          {AI_PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const isSelected = aiProvider === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => setAiProvider(provider.id)}
                className={`relative rounded-xl p-4 text-left transition-all ${
                  isSelected
                    ? `bg-gradient-to-br ${provider.color} text-white shadow-lg ring-2 ring-white/50`
                    : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} />
                  <span className="font-semibold text-sm">{provider.name}</span>
                </div>
                <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  {provider.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Parse Mode */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Parse mode:</span>
          <div className="flex gap-2">
            {[
              { id: 'auto' as const, label: 'Auto (full analysis)' },
              { id: 'structure' as const, label: 'Structure only' },
              { id: 'specs' as const, label: 'Technical specs' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setParseMode(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  parseMode === mode.id
                    ? 'bg-brand-blue text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          isDragging
            ? 'border-brand-blue bg-brand-blue/5'
            : 'border-slate-300 hover:border-brand-blue/50 bg-white/30'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center">
          <motion.div
            animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-cyan/10 mb-4"
          >
            <Upload size={32} className="text-brand-blue" />
          </motion.div>
          <h3 className="font-display text-lg font-semibold text-slate-800 mb-2">
            Upload HDVH Documents
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Drag & drop files here, or click to browse
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Supported formats:</span>
            <span className="px-2 py-1 bg-slate-100 rounded">PDF</span>
            <span className="px-2 py-1 bg-slate-100 rounded">DOCX</span>
            <span className="px-2 py-1 bg-slate-100 rounded">PNG</span>
            <span className="px-2 py-1 bg-slate-100 rounded">JPG</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Max file size: 50MB per file</p>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl bg-white/40 backdrop-blur-xl p-6 shadow-premium border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-slate-800">
                Uploaded Files ({files.length})
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Using <strong className="text-brand-blue">{AI_PROVIDERS.find(p => p.id === aiProvider)?.name}</strong>
                </span>
                {files.some((f) => f.status === 'uploaded') && (
                  <button
                    onClick={startParsing}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={16} />
                    Start AI Analysis
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group flex items-center gap-4 rounded-xl bg-white/30 p-3 transition-all hover:bg-white/50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                    {getFileIcon(file.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    {file.status === 'uploading' && (
                      <div className="flex items-center gap-2 text-blue-500">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-xs whitespace-nowrap">Uploading {file.progress}%</span>
                      </div>
                    )}
                    {file.status === 'uploaded' && (
                      <div className="flex items-center gap-2 text-emerald-500">
                        <CheckCircle size={16} />
                        <span className="text-xs">Ready for AI</span>
                      </div>
                    )}
                    {file.status === 'parsing' && (
                      <div className="flex items-center gap-2 text-brand-blue">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-xs whitespace-nowrap">AI Analyzing {file.progress}%</span>
                      </div>
                    )}
                    {file.status === 'parsed' && (
                      <div className="flex items-center gap-2 text-brand-green">
                        <CheckCircle size={16} />
                        <span className="text-xs">Completed</span>
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle size={16} />
                        <span className="text-xs">{file.error || 'Error'}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {(file.status === 'uploading' || file.status === 'parsing') && (
                    <div className="w-20">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan"
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
                  {file.status === 'uploaded' && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <X size={16} />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      {files.length === 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-blue/5 to-brand-cyan/5 p-6 border border-brand-blue/10">
          <h4 className="font-semibold text-slate-700 mb-2">🤖 AI-Powered HDVH Analysis</h4>
          <p className="text-sm text-slate-500">
            Our AI will automatically analyze your operation manuals (HDVH), extract project structure,
            identify technical specifications, equipment lists, and create an interactive project tree.
            Supports PDF documents and images with text/diagrams.
          </p>
          <div className="mt-3 flex gap-4 text-xs text-slate-400">
            <span>📄 Extract document structure</span>
            <span>🔍 Identify technical specs</span>
            <span>📊 Create project hierarchy</span>
            <span>🖼️ Analyze diagrams & images</span>
          </div>
        </div>
      )}
    </div>
  );
}