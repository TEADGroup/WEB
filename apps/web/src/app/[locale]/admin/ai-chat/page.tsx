'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, Trash2, Loader2, Cpu, Brain, User, Bot, Globe, Sparkles, BookHeart,
  BookText, Atom,
} from 'lucide-react';
import { useSwrFetch } from '@/lib/use-swr-fetch';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  searched?: boolean;
  provider?: string;
}

interface UserFact {
  key: string;
  value: string;
  learnedAt: string;
}

interface MemoryData {
  typeCorrections: Record<string, string>;
  promptTips: string[];
  chatNotes: string[];
  userFacts?: UserFact[];
  updatedAt: string;
}

const PROVIDERS = [
  { id: 'ollama', label: 'Ollama', icon: BookText, color: 'from-orange-500 to-amber-500' },
  { id: 'gemini', label: 'Command Code', icon: Atom, color: 'from-blue-500 to-cyan-500' },
  { id: 'claude', label: 'Claude', icon: Brain, color: 'from-purple-500 to-pink-500' },
  { id: 'openai', label: 'OpenAI', icon: Cpu, color: 'from-emerald-500 to-teal-500' },
];

/* ─── Animated thinking dots ─── */
function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="h-[5px] w-[5px] rounded-full bg-brand-blue/50"
          style={{
            animation: 'dotPulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  );
}

/* ─── Message bubble ─── */
function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-gradient-to-br from-slate-500 to-slate-600'
            : 'bg-gradient-to-br from-brand-blue to-brand-cyan'
        }`}
      >
        {isUser ? <User size={13} className="text-white" /> : <Bot size={13} className="text-white" />}
      </div>

      <div className={`group max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-gradient-to-br from-brand-cyan to-brand-blue text-white'
              : 'rounded-tl-sm bg-white text-slate-700 shadow-sm ring-1 ring-black/[0.04]'
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
        <div className="mt-1 flex items-center gap-2 px-1">
          {msg.searched && !isUser && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500/70 font-medium">
              <Globe size={10} />
              Đã tra cứu web
            </span>
          )}
          {msg.provider && !isUser && (
            <span className="text-[10px] text-slate-400">{msg.provider}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Welcome screen ─── */
function WelcomeScreen({ onExampleClick }: { onExampleClick: (q: string) => void }) {
  const examples = [
    'PLC Siemens S7-1200 hoạt động thế nào?',
    'So sánh biến tần Siemens và Delta',
    'Quy trình bảo trì tủ điện hàng tháng',
    'Tin tức tự động hóa mới nhất 2026',
  ];

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-6 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-cyan/15 shadow-inner">
        <Bot size={30} className="text-brand-blue" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-xl font-bold text-slate-800">Trợ lý AI TEA Group</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Sẵn sàng trả lời mọi thắc mắc
        </p>
      </div>
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {examples.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => onExampleClick(e)}
            className="rounded-xl border border-black/[0.06] bg-white/60 px-3.5 py-2.5 text-left text-xs text-slate-500 backdrop-blur transition-all duration-200 hover:border-brand-blue/20 hover:bg-white hover:text-slate-700 hover:shadow-sm"
          >
            <Sparkles size={12} className="mb-1 inline-block text-brand-blue/50" />
            {' '}{e}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('ollama');
  const [memory, setMemory] = useState<MemoryData | null>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // SWR — cached settings & memory for instant back-navigation
  const { data: allSettings } = useSwrFetch<{ ai_config: { value: { defaultProvider?: string } } | null }>('/api/settings?key=ai_config,company');
  const { data: chatData } = useSwrFetch<{ memory: MemoryData }>('/api/ai-chat');

  useEffect(() => {
    if (allSettings?.ai_config?.value?.defaultProvider) setProvider(allSettings.ai_config.value.defaultProvider);
  }, [allSettings]);
  useEffect(() => {
    if (chatData?.memory) setMemory(chatData.memory);
  }, [chatData]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const q = input;
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          history: messages.slice(-20),
          search: searchEnabled,
          provider: provider,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, searched: data.searched, provider: provider }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${data.error}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Lỗi kết nối: ${(err as Error).message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleExampleClick(q: string) { setInput(q); inputRef.current?.focus(); }
  async function handleClearMemory() {
    if (!confirm('Xóa toàn bộ AI memory?')) return;
    await fetch('/api/ai-chat', { method: 'DELETE' });
    setMemory(null);
  }

  const hasMessages = messages.length > 0;
  const activeProvider = PROVIDERS.find(p => p.id === provider);

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col overflow-hidden">
      <header className="mb-2 flex shrink-0 items-center justify-between sm:mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-cyan shadow-sm">
            <Bot size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800">Chat</h1>
            <p className="text-[11px] text-slate-400 leading-tight">{activeProvider?.label || 'AI'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Provider Selector */}
          <div className="hidden sm:flex items-center gap-1">
            {PROVIDERS.map(p => {
              const Icon = p.icon;
              const isActive = provider === p.id;
              return (
                <button key={p.id} onClick={() => setProvider(p.id)}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all ${
                    isActive ? `bg-gradient-to-r ${p.color} text-white shadow-sm` : 'text-slate-400 hover:text-slate-600'
                  }`}>
                  <Icon size={12} />
                  <span className="hidden lg:inline">{p.label}</span>
                </button>
              );
            })}
          </div>

          <button type="button" onClick={() => setSearchEnabled(!searchEnabled)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
              searchEnabled ? 'border-brand-blue/25 bg-brand-blue/8 text-brand-blue' : 'border-black/8 bg-white/50 text-slate-400 hover:bg-white'
            }`}>
            <Globe size={12} />
            <span className="hidden sm:inline">Web</span>
          </button>

          <button type="button" onClick={() => setShowMemory(!showMemory)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
              showMemory ? 'border-brand-blue/25 bg-brand-blue/8 text-brand-blue' : 'border-black/8 bg-white/50 text-slate-400 hover:bg-white'
            }`}>
            <Brain size={12} />
            <span className="hidden sm:inline">Memory</span>
          </button>

          {hasMessages && (
            <button type="button" onClick={() => setMessages([])}
              className="flex items-center gap-1.5 rounded-lg border border-black/8 bg-white/50 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition-all hover:bg-white hover:text-red-400">
              <Trash2 size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </header>

      {showMemory && (
        <div className="mb-2 shrink-0 rounded-xl border border-black/[0.05] bg-white/40 p-3 backdrop-blur sm:mb-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-600">Memory</h3>
            <button type="button" onClick={handleClearMemory} className="rounded px-2 py-0.5 text-[10px] font-medium text-red-400 hover:bg-red-50">Xóa</button>
          </div>
          {memory ? (
            <div className="space-y-2 text-xs text-slate-500">
              {(memory.userFacts?.length ?? 0) > 0 && (
                <div className="rounded-lg bg-white/50 p-2">
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><BookHeart size={10} /> AI biết về bạn</span>
                  {(memory.userFacts ?? []).map((f, i) => (
                    <p key={i} className="mt-0.5">• {f.key.replace('user_', '')}: {f.value}</p>
                  ))}
                </div>
              )}
              {Object.entries(memory.typeCorrections || {}).length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Type corrections</span>
                  {Object.entries(memory.typeCorrections).slice(0, 3).map(([t, v]) => (
                    <p key={t} className="mt-0.5">• &ldquo;{t.slice(0, 30)}&rdquo; → {v}</p>
                  ))}
                </div>
              )}
              {(memory.promptTips || []).length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Kiến thức đã học</span>
                  {memory.promptTips.slice(0, 3).map((tip, i) => (
                    <p key={i} className="mt-0.5">• {tip}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Chưa có gì. Nói &ldquo;tôi tên là...&rdquo; để AI nhớ bạn.</p>
          )}
        </div>
      )}

      <div ref={chatContainerRef} className="min-h-0 flex-1 overflow-y-auto px-0.5">
        {!hasMessages && !loading ? (
          <WelcomeScreen onExampleClick={handleExampleClick} />
        ) : (
          <div className="mx-auto max-w-2xl space-y-5 py-4">
            {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-cyan">
                  <Bot size={13} className="text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-black/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium text-slate-400">
                      {provider === 'gemini' ? 'Command Code đang trả lời...' :
                       provider === 'claude' ? 'Claude đang phân tích...' :
                       provider === 'openai' ? 'OpenAI đang xử lý...' :
                       'Đang suy nghĩ...'}
                    </span>
                    <ThinkingDots />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="mt-3 shrink-0 sm:mt-4">
        <form onSubmit={handleSend} className="mx-auto max-w-2xl">
          <div className="relative flex items-center gap-2 rounded-2xl border border-black/[0.07] bg-white/70 p-1.5 shadow-sm backdrop-blur transition-all duration-200 focus-within:border-brand-blue/30 focus-within:shadow-md focus-within:shadow-brand-blue/5">
            <input ref={inputRef}
              type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Hỏi AI về tự động hóa..." disabled={loading} autoFocus
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-40"
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue p-2.5 text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            Đang dùng: <strong>{activeProvider?.label}</strong> • Enter để gửi
          </p>
        </form>
      </div>

      <style jsx>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
