'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Globe, FileText, Image, Tag, Plus, Trash2, Star } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import type { ImageItem } from '@/components/admin/ImageUpload';

interface ProjectData {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  description_vi: string;
  description_en: string;
  client?: string;
  location?: string;
  date?: string;
  images?: string[];
  attachments?: string[];
  sections?: ProjectSection[];
  is_featured?: boolean;
  featured_year?: number;
  featured_month?: number;
  featured_order?: number;
  company_logo_url?: string;
  scope_vi?: string;
  scope_en?: string;
}

interface ProjectSection {
  id: string;
  title_vi: string;
  type: string;
  content_vi: string;
  sort_order: number;
  status: string;
}

const CATEGORIES = [
  'line-automation',
  'control-cabinets',
  'plc-scada',
  'system-integration',
  'maintenance',
  'other',
];

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const isNew = projectId === 'create';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'structure' | 'media' | 'featured'>('content');

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('system-integration');
  const [status, setStatus] = useState('draft');
  const [descriptionVi, setDescriptionVi] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [projectImages, setProjectImages] = useState<ImageItem[]>([]);
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredYear, setFeaturedYear] = useState<number>(new Date().getFullYear());
  const [featuredMonth, setFeaturedMonth] = useState<number | ''>('');
  const [featuredOrder, setFeaturedOrder] = useState(0);
  const [scopeVi, setScopeVi] = useState('');
  const [scopeEn, setScopeEn] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto sort order: tự tìm order cao nhất + 1 khi thêm mới
  useEffect(() => {
    if (!isNew || !isFeatured) return;
    fetch('/api/projects?featured=true')
      .then(r => r.json())
      .then((projects: any[]) => {
        const maxOrder = projects.reduce((max, p) => Math.max(max, p.featured_order || 0), -1);
        setFeaturedOrder(maxOrder + 1);
      })
      .catch(() => {});
  }, [isNew, isFeatured]);

  useEffect(() => {
    if (!isNew && projectId) {
      setLoading(true);
      fetch(`/api/projects/${projectId}`)
        .then(r => r.json())
        .then(d => {
          if (d && d.title) {
            setTitle(d.title);
            setSlug(d.slug || '');
            setCategory(d.category || 'system-integration');
            setStatus(d.status || 'draft');
            setDescriptionVi(d.description_vi || '');
            setDescriptionEn(d.description_en || '');
            setClient(d.client || '');
            setLocation(d.location || '');
            setDate(d.date || '');
            setSections(d.sections || []);
            setProjectImages((Array.isArray(d.images) ? d.images : []).map((img: any) =>
              typeof img === 'string' ? { url: img, caption: '' } : { url: img.url || '', caption: img.caption || '' }
            ));
            setIsFeatured(d.is_featured || false);
            setFeaturedYear(d.featured_year || new Date().getFullYear());
            setFeaturedMonth(d.featured_month || '');
            setFeaturedOrder(d.featured_order || 0);
            setCompanyLogoUrl(d.company_logo_url || '');
            setScopeVi(d.scope_vi || '');
            setScopeEn(d.scope_en || '');
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load project');
          setLoading(false);
        });
    }
  }, [projectId, isNew]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/projects' : `/api/projects/${projectId}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category,
          status,
          description_vi: descriptionVi,
          description_en: descriptionEn,
          client,
          location,
          date,
          images: projectImages,
          is_featured: isFeatured,
          featured_year: isFeatured ? featuredYear : null,
          featured_month: isFeatured ? (featuredMonth || null) : null,
          featured_order: isFeatured ? featuredOrder : 0,
          company_logo_url: isFeatured ? (companyLogoUrl || null) : null,
          scope_vi: isFeatured ? (scopeVi || null) : null,
          scope_en: isFeatured ? (scopeEn || null) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      // Redirect to projects list after save
      if (isNew && data.id) {
        router.push(`/admin/projects-manager/${data.id}`);
      } else {
        router.push('/admin/projects-manager');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-32 animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/admin/projects-manager')}
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-all"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan truncate">
              {isNew ? 'Create Project' : 'Edit Project'}
            </h1>
            {!isNew && (
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate">{slug}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={15} className="animate-spin sm:size-4" /> : <Save size={15} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 border-b border-black/8 pb-3 sm:pb-4 overflow-x-auto">
        {[
          { key: 'content', label: 'Content', icon: FileText },
          { key: 'structure', label: 'Structure', icon: Tag },
          { key: 'media', label: 'Media', icon: Image },
          { key: 'featured', label: 'Featured', icon: Star },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon size={15} className="sm:size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-4 sm:p-5 lg:p-6 border border-white/20 shadow-premium">
              <h3 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Basic Information</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Project Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-shadow"
                    placeholder="Enter project title"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat.replace(/-/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Client</label>
                    <input
                      type="text"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      placeholder="Client name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      placeholder="Project location"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-4 sm:p-5 lg:p-6 border border-white/20 shadow-premium">
              <h3 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Descriptions</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    <Globe size={13} className="text-brand-blue" />
                    Vietnamese
                  </label>
                  <textarea
                    value={descriptionVi}
                    onChange={(e) => setDescriptionVi(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 resize-none"
                    placeholder="Mô tả dự án bằng tiếng Việt"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    <Globe size={13} className="text-emerald-500" />
                    English
                  </label>
                  <textarea
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 resize-none"
                    placeholder="Describe your project in English"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Structure Tab */}
      {activeTab === 'structure' && (
        <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-6 border border-white/20 shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-800">Project Sections</h3>
              <p className="text-sm text-slate-400 mt-1">
                Manage the structure and hierarchy of your project
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-all hover:scale-[1.02]">
              <Plus size={16} />
              Add Section
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 mb-4">
                <Tag size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-400">No sections defined yet</p>
              <p className="text-xs text-slate-300 mt-1">Click "Add Section" to create the first one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex items-center gap-4 rounded-xl bg-white/30 px-4 py-3 hover:bg-white/50 transition-all"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{section.title_vi || 'Untitled Section'}</p>
                    <p className="text-xs text-slate-400">{section.type}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    section.status === 'published' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {section.status}
                  </span>
                  <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-4 sm:p-5 lg:p-6 border border-white/20 shadow-premium">
          <div className="mb-4">
            <h3 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-slate-800 mb-1">Project Images</h3>
            <p className="text-xs sm:text-sm text-slate-400">Upload images or paste image URLs. Captions are optional.</p>
          </div>
          <ImageUpload
            images={projectImages}
            onChange={setProjectImages}
            title="Hình ảnh dự án"
            subtitle="Tải ảnh từ máy hoặc dán URL (JPEG, PNG, WebP, SVG)"
            showCaption={true}
            allowUrl={true}
          />
        </div>
      )}

      {/* Featured Tab */}
      {activeTab === 'featured' && (
        <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-4 sm:p-5 lg:p-6 border border-white/20 shadow-premium">
          <div className="flex items-center gap-3 mb-6">
            <Star size={20} className="text-amber-500" />
            <div>
              <h3 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-slate-800">
                Featured on Timeline
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Show this project on the 3D timeline on the homepage
              </p>
            </div>
            <label className="relative ml-auto inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-blue/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue" />
            </label>
          </div>

          {isFeatured && (
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Left column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Year</label>
                  <select
                    value={featuredYear}
                    onChange={(e) => setFeaturedYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700"
                  >
                    {Array.from({ length: 11 }, (_, i) => 2020 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Month</label>
                  <select
                    value={featuredMonth}
                    onChange={(e) => setFeaturedMonth(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700"
                  >
                    <option value="">—</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2024, m - 1).toLocaleString('en-US', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    value={featuredOrder}
                    onChange={(e) => setFeaturedOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white/40 p-4">
                  <ImageUpload
                    images={companyLogoUrl ? [{ url: companyLogoUrl }] : []}
                    onChange={(imgs) => setCompanyLogoUrl(imgs[0]?.url || '')}
                    title="Company Logo"
                    subtitle="Logo công ty (hiển thị trên timeline 3D)"
                    showCaption={false}
                    allowUrl={true}
                    maxSizeMB={2}
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                    <Globe size={13} className="text-brand-blue" />
                    Vietnamese Scope
                  </label>
                  <textarea
                    value={scopeVi}
                    onChange={(e) => setScopeVi(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 resize-none"
                    placeholder="Mô tả ngắn phạm vi dự án (hiển thị trên timeline)"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                    <Globe size={13} className="text-emerald-500" />
                    English Scope
                  </label>
                  <textarea
                    value={scopeEn}
                    onChange={(e) => setScopeEn(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 resize-none"
                    placeholder="Short project scope (shown on timeline)"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}