'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Save, Loader2, Building, Cpu, Globe, Mail, Phone, MapPin, Bot, Key, RefreshCw, Brain, BookText, Atom } from 'lucide-react';
import { useSwrFetch } from '@/lib/use-swr-fetch';

interface CompanySettings {
  name: string;
  name_en: string;
  slogan_vi: string;
  slogan_en: string;
  description_vi: string;
  description_en: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
}

interface AIConfig {
  defaultProvider: string;
  /* Ollama */
  ollamaModel: string;
  ollamaBaseUrl: string;
  /* Command Code */
  geminiApiKey: string;
  geminiModel: string;
  /* Claude / Anthropic */
  claudeApiKey: string;
  claudeModel: string;
  /* OpenAI */
  openaiApiKey: string;
  openaiModel: string;
  /* Legacy (backward compat) */
  provider?: string;
  apiKey?: string;
  model?: string;
}

const DEFAULT_COMPANY: CompanySettings = {
  name: '',
  name_en: '',
  slogan_vi: '',
  slogan_en: '',
  description_vi: '',
  description_en: '',
  address: '',
  phone: '',
  email: '',
  logo_url: '',
};

const DEFAULT_AI: AIConfig = {
  defaultProvider: 'ollama',
  /* Ollama */
  ollamaModel: 'qwen2.5vl:latest',
  ollamaBaseUrl: 'http://localhost:11434',
  /* Command Code */
  geminiApiKey: '',
  geminiModel: 'zai-org/GLM-5.2',
  /* Claude */
  claudeApiKey: '',
  claudeModel: 'claude-3-5-sonnet-20241022',
  /* OpenAI */
  openaiApiKey: '',
  openaiModel: 'gpt-4o',
};

interface SettingsMultiResponse {
  company: { value: CompanySettings } | null;
  ai_config: { value: AIConfig } | null;
}

export default function SettingsPage() {
  const t = useTranslations('Admin');
  const [tab, setTab] = useState<'company' | 'ai'>('company');
  const [aiProviderTab, setAiProviderTab] = useState<'ollama' | 'gemini' | 'claude' | 'openai'>('ollama');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [company, setCompany] = useState<CompanySettings>(DEFAULT_COMPANY);
  const [aiConfig, setAiConfig] = useState<AIConfig>(DEFAULT_AI);
  const [showKey, setShowKey] = useState(false);

  // Single SWR call for ALL settings — gộp 2 queries thành 1 request
  const { data: settingsData, isLoading } = useSwrFetch<SettingsMultiResponse>('/api/settings?key=company,ai_config');

  // Sync SWR data into local state once loaded
  useEffect(() => {
    if (settingsData?.company?.value) setCompany({ ...DEFAULT_COMPANY, ...settingsData.company.value });
  }, [settingsData]);
  useEffect(() => {
    if (settingsData?.ai_config?.value) setAiConfig({ ...DEFAULT_AI, ...settingsData.ai_config.value });
  }, [settingsData]);

  const loading = isLoading;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const key = tab === 'company' ? 'company' : 'ai_config';
      const value = tab === 'company' ? company : aiConfig;

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-0.5 sm:space-y-1">
        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan">
          {t('settings')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">Manage your system configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setTab('company')}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
            tab === 'company'
              ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
              : 'bg-white/60 text-slate-600 hover:bg-white/80'
          }`}
        >
          <Building size={16} className="sm:size-[18px]" />
          Company Info
        </button>
        <button
          onClick={() => setTab('ai')}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
            tab === 'ai'
              ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
              : 'bg-white/60 text-slate-600 hover:bg-white/80'
          }`}
        >
          <Cpu size={16} className="sm:size-[18px]" />
          AI Provider
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-600 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          {success}
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Company Settings */}
      {tab === 'company' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Basic Info */}
          <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-4 sm:p-5 lg:p-6 border border-white/20 shadow-premium">
            <h3 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4 sm:mb-6">
              <Building size={18} className="text-brand-blue sm:size-5" />
              Company Information
            </h3>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    Company Name (VI)
                  </label>
                  <input
                    type="text"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    Company Name (EN)
                  </label>
                  <input
                    type="text"
                    value={company.name_en}
                    onChange={(e) => setCompany({ ...company, name_en: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    Slogan (VI)
                  </label>
                  <input
                    type="text"
                    value={company.slogan_vi}
                    onChange={(e) => setCompany({ ...company, slogan_vi: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    Slogan (EN)
                  </label>
                  <input
                    type="text"
                    value={company.slogan_en}
                    onChange={(e) => setCompany({ ...company, slogan_en: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    Description (VI)
                  </label>
                  <textarea
                    value={company.description_vi}
                    onChange={(e) => setCompany({ ...company, description_vi: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    Description (EN)
                  </label>
                  <textarea
                    value={company.description_en}
                    onChange={(e) => setCompany({ ...company, description_en: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-4 sm:p-5 lg:p-6 border border-white/20 shadow-premium">
            <h3 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4 sm:mb-6">
              <Globe size={18} className="text-brand-blue sm:size-5" />
              Contact Information
            </h3>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                  <MapPin size={13} className="text-brand-blue" />
                  Address
                </label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                  <Phone size={13} className="text-brand-blue" />
                  Phone
                </label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                  <Mail size={13} className="text-brand-blue" />
                  Email
                </label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Logo URL</label>
                <input
                  type="text"
                  value={company.logo_url}
                  onChange={(e) => setCompany({ ...company, logo_url: e.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </motion.div>
      )}

      {/* AI Settings */}
      {tab === 'ai' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
          {/* Default Provider */}
          <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-4 sm:p-5 lg:p-6 border border-white/20 shadow-premium">
            <h3 className="font-display text-sm sm:text-base lg:text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4 sm:mb-6">
              <Bot size={18} className="text-brand-blue sm:size-5" />
              AI Providers
            </h3>

            {/* Provider tabs */}
            <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1">
              {[
                { id: 'ollama' as const, label: 'Ollama (Local)', icon: BookText },
                { id: 'gemini' as const, label: 'Command Code', icon: Atom },
                { id: 'claude' as const, label: 'Claude (Anthropic)', icon: Brain },
                { id: 'openai' as const, label: 'OpenAI (GPT)', icon: Cpu },
              ].map(p => {
                const Icon = p.icon;
                const active = aiProviderTab === p.id;
                return (
                  <button key={p.id} onClick={() => setAiProviderTab(p.id)}
                    className={`flex items-center gap-1 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-medium whitespace-nowrap transition-all ${
                      active ? 'bg-brand-blue text-white shadow-lg' : 'bg-white/60 text-slate-600 hover:bg-white/80'
                    }`}>
                    <Icon size={14} className="sm:size-4" />
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Default Provider Selector */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-0.5 sm:mb-1">Default Provider</label>
              <p className="text-[11px] sm:text-xs text-slate-500 mb-1.5 sm:mb-2">Provider sẽ được dùng mặc định khi AI không chỉ định provider cụ thể</p>
              <select value={aiConfig.defaultProvider} onChange={e => setAiConfig({ ...aiConfig, defaultProvider: e.target.value })}
                className="w-full max-w-xs rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700">
                <option value="ollama">Ollama (Local - free)</option>
                <option value="gemini">Command Code</option>
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI (GPT)</option>
              </select>
            </div>

            {/* Ollama Config */}
            {aiProviderTab === 'ollama' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Model</label>
                  <input type="text" value={aiConfig.ollamaModel} onChange={e => setAiConfig({ ...aiConfig, ollamaModel: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    placeholder="qwen2.5vl:latest" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Base URL</label>
                  <input type="text" value={aiConfig.ollamaBaseUrl} onChange={e => setAiConfig({ ...aiConfig, ollamaBaseUrl: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    placeholder="http://localhost:11434" />
                </div>
                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 p-3 sm:p-4 border border-emerald-200">
                  <p className="text-xs sm:text-sm font-medium text-emerald-700">✓ No API key needed — runs locally</p>
                  <p className="text-[11px] sm:text-xs text-emerald-600 mt-0.5">Yêu cầu Ollama đang chạy trên máy. Tải tại ollama.com</p>
                </div>
              </div>
            )}

            {/* Command Code Config */}
            {aiProviderTab === 'gemini' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    <Key size={13} className="text-brand-blue" />
                    Command Code API Key
                  </label>
                  <div className="relative">
                    <input type={showKey ? 'text' : 'password'} value={aiConfig.geminiApiKey} onChange={e => setAiConfig({ ...aiConfig, geminiApiKey: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 pr-9 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      placeholder="cc-..." />
                    <button type="button" onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <Key size={15} />
                    </button>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Lấy key tại <a href="https://commandcode.ai" target="_blank" className="text-brand-blue underline">commandcode.ai</a> &middot; Endpoint: api.commandcode.ai/provider/v1</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Model</label>
                  <select value={aiConfig.geminiModel} onChange={e => setAiConfig({ ...aiConfig, geminiModel: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700">
                    <option value="zai-org/GLM-5.2">GLM 5.2</option>
                    <option value="zai-org/GLM-5.2-Fast">GLM 5.2 Fast</option>
                    <option value="zai-org/GLM-5.1">GLM 5.1</option>
                    <option value="zai-org/GLM-5">GLM 5</option>
                    <option value="claude-sonnet-5">Claude Sonnet 5</option>
                    <option value="claude-fable-5">Claude Fable 5</option>
                    <option value="deepseek/deepseek-v4-pro">DeepSeek V4 Pro</option>
                    <option value="deepseek/deepseek-v4-flash">DeepSeek V4 Flash</option>
                  </select>
                </div>
                <div className={`rounded-xl p-3 sm:p-4 border ${aiConfig.geminiApiKey ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full ${aiConfig.geminiApiKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-medium text-slate-700">{aiConfig.geminiApiKey ? 'Command Code configured' : 'Chưa có API Key'}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Multi-model AI gateway &middot; GLM, Claude, GPT, DeepSeek, Qwen...</p>
                </div>
              </div>
            )}

            {/* Claude Config */}
            {aiProviderTab === 'claude' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    <Key size={13} className="text-brand-blue" />
                    Claude API Key
                  </label>
                  <div className="relative">
                    <input type={showKey ? 'text' : 'password'} value={aiConfig.claudeApiKey} onChange={e => setAiConfig({ ...aiConfig, claudeApiKey: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 pr-9 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      placeholder="sk-ant-..." />
                    <button type="button" onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <Key size={15} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Model</label>
                  <select value={aiConfig.claudeModel} onChange={e => setAiConfig({ ...aiConfig, claudeModel: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700">
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Best)</option>
                    <option value="claude-3-opus-20240229">Claude 3 Opus (Powerful)</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</option>
                  </select>
                </div>
                <div className={`rounded-xl p-3 sm:p-4 border ${aiConfig.claudeApiKey ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full ${aiConfig.claudeApiKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-medium text-slate-700">{aiConfig.claudeApiKey ? 'Claude configured' : 'Chưa có API Key'}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Claude tốt nhất cho phân tích tài liệu kỹ thuật</p>
                </div>
              </div>
            )}

            {/* OpenAI Config */}
            {aiProviderTab === 'openai' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                    <Key size={13} className="text-brand-blue" />
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input type={showKey ? 'text' : 'password'} value={aiConfig.openaiApiKey} onChange={e => setAiConfig({ ...aiConfig, openaiApiKey: e.target.value })}
                      className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 pr-9 text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      placeholder="sk-..." />
                    <button type="button" onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <Key size={15} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">Model</label>
                  <select value={aiConfig.openaiModel} onChange={e => setAiConfig({ ...aiConfig, openaiModel: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-700">
                    <option value="gpt-4o">GPT-4o (Best)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
                  </select>
                </div>
                <div className={`rounded-xl p-3 sm:p-4 border ${aiConfig.openaiApiKey ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full ${aiConfig.openaiApiKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-medium text-slate-700">{aiConfig.openaiApiKey ? 'OpenAI configured' : 'Chưa có API Key'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save All Config'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}