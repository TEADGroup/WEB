import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/modules/auth/rbac';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { buildMemoryPrompt, type AiMemory, createEmptyMemory, recordPromptTip, recordUserFact, detectUserFacts } from '@/server/modules/hdvh-parser/memory';
import { searchWeb, formatSearchContext, looksLikeUnknown, compressToMemoryNote } from '@/lib/search/search-web';
import { fetchKnowledgeBase, formatKnowledgeBase } from '@/lib/search/knowledge-base';
import type { AiConfig } from '@tea/shared';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any; // Database type trong supabase.ts chưa đầy đủ — cần Supabase CLI gen types hoàn chỉnh

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Gọi Ollama API, trả về text reply. */
async function callOllama(
  messages: ChatMessage[],
  model: string,
  baseUrl: string,
): Promise<string> {
  const resp = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.7, num_ctx: 8192 },
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Ollama error: ${err.slice(0, 300)}`);
  }
  const data = await resp.json();
  return data.message?.content || '';
}

/** Gọi Command Code API (OpenAI-compatible), trả về text reply. */
async function callZAI(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
): Promise<string> {
  const userMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const sysMsg = messages.find(m => m.role === 'system')?.content || '';

  const resp = await fetch('https://api.commandcode.ai/provider/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'zai-org/GLM-5.2',
      messages: [
        ...(sysMsg ? [{ role: 'system', content: sysMsg }] : []),
        { role: 'user', content: userMsg },
      ],
      temperature: 1.0,
      stream: false,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    let msg = err.slice(0, 300);
    try { const e = JSON.parse(err); msg = e.error?.message || msg; } catch {}
    if (resp.status === 401) msg = 'API Key invalid. Vào Settings > AI Provider để cập nhật.';
    throw new Error(`Command Code: ${msg}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

/** Gọi Claude (Anthropic) API, trả về text reply. */
async function callClaude(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
): Promise<string> {
  const userMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const sysMsg = messages.find(m => m.role === 'system')?.content || '';

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: sysMsg,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude error: ${err.slice(0, 300)}`);
  }
  const data = await resp.json();
  return data.content?.[0]?.text || '';
}

/** Router: chọn provider và gọi API tương ứng */
async function callAI(
  messages: ChatMessage[],
  provider: string,
  aiConfig: Record<string, any>,
): Promise<string> {
  switch (provider) {
    case 'gemini': {
      const model = aiConfig.geminiModel || 'zai-org/GLM-5.2';
      // Check both new field and legacy field
      const apiKey = aiConfig.geminiApiKey || aiConfig.apiKey || '';
      if (!apiKey) throw new Error('Command Code API Key chưa được cấu hình. Vào Settings > AI Provider để thêm key.');
      return callZAI(messages, model, apiKey);
    }
    case 'claude': {
      const model = aiConfig.claudeModel || 'claude-3-5-sonnet-20241022';
      const apiKey = aiConfig.claudeApiKey || aiConfig.apiKey || '';
      if (!apiKey) throw new Error('Claude API Key chưa được cấu hình. Vào Settings > AI Provider để thêm key.');
      return callClaude(messages, model, apiKey);
    }
    case 'openai': {
      const model = aiConfig.openaiModel || 'gpt-4o';
      const apiKey = aiConfig.openaiApiKey || '';
      if (!apiKey) throw new Error('OpenAI API Key chưa được cấu hình.');
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });
      if (!resp.ok) throw new Error(`OpenAI error: ${(await resp.text()).slice(0, 300)}`);
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '';
    }
    default: {
      // Ollama (local)
      const model = process.env.OLLAMA_MODEL || aiConfig.ollamaModel || 'qwen2.5vl:latest';
      const baseUrl = process.env.OLLAMA_BASE_URL || aiConfig.ollamaBaseUrl || 'http://localhost:11434';
      return callOllama(messages, model, baseUrl);
    }
  }
}

// ─── Build system prompt ───────────────────────────────────────

function buildSystemText(memory: AiMemory, kbContext: string, webContext: string): string {
  return [
    'Bạn là trợ lý AI cho TEA Group, công ty tự động hóa công nghiệp tại Việt Nam.',
    'Trả lời bằng tiếng Việt, thân thiện, chính xác, chuyên nghiệp.',
    'Bạn hiểu về: PLC, HMI, SCADA, biến tần, tủ điện, cảm biến, hệ thống tự động hóa.',
    '',
    kbContext ? '===== KIẾN THỨC NỘI BỘ (TEA Group) =====' : '',
    kbContext,
    kbContext ? '===== KẾT THÚC KIẾN THỨC NỘI BỘ =====' : '',
    '',
    webContext ? '===== THÔNG TIN TỪ INTERNET =====' : '',
    webContext,
    webContext ? '===== KẾT THÚC THÔNG TIN INTERNET =====' : '',
    '',
    'HƯỚNG DẪN:',
    '- Ưu tiên dùng KIẾN THỨC NỘI BỘ để trả lời về TEA Group, dự án, thông tin công ty.',
    '- Nếu câu hỏi cần kiến thức cập nhật hoặc ngoài phạm vi → dùng THÔNG TIN TỪ INTERNET.',
    '- ĐÃ CÓ thông tin người dùng bên dưới → dùng nó để xưng hô và trả lời cá nhân hóa.',
    '- KHÔNG có thông tin người dùng bên dưới → hỏi tên nếu phù hợp.',
    '- Luôn ghi rõ nguồn (tên trang web) khi dùng thông tin từ Internet.',
    buildMemoryPrompt(memory),
  ].filter(Boolean).join('\n');
}

// ─── POST ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const svc = createSupabaseServiceClient() as Db;
    const body = await request.json();
    const { message, history = [], search: forceSearch, provider: reqProvider } = body as {
      message?: string;
      history?: ChatMessage[];
      search?: boolean;
      provider?: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Load config + memory + Knowledge Base
    const { data: aiConfigData } = await svc
      .from('settings').select('value').eq('key', 'ai_config').single();
    const aiConfig = (aiConfigData?.value as Record<string, any>) || {};

    const { data: memData } = await svc
      .from('settings').select('value').eq('key', 'ai_memory').single();
    let memory: AiMemory = (memData?.value as AiMemory) || createEmptyMemory();

    // Determine which provider to use
    const provider = reqProvider || aiConfig.defaultProvider || 'ollama';

    // ── Auto-detect: user giới thiệu thông tin cá nhân? ─────
    const detectedFacts = detectUserFacts(message);
    if (detectedFacts.length > 0) {
      for (const fact of detectedFacts) {
        memory = recordUserFact(memory, fact.key, fact.value);
        console.log(`[ai-chat] Học thông tin: ${fact.key} = "${fact.value}"`);
      }
      await svc.from('settings').upsert(
        { key: 'ai_memory', value: memory },
        { onConflict: 'key' },
      );
    } else {
      // Luôn upsert memory để đảm bảo nó tồn tại trong DB
      // (phòng trường hợp seed chưa chạy hoặc bị xóa)
      await svc.from('settings').upsert(
        { key: 'ai_memory', value: memory },
        { onConflict: 'key' },
      );
    }

    // Load Knowledge Base (luôn có, không cần search)
    const kb = await fetchKnowledgeBase();
    const kbContext = formatKnowledgeBase(kb);

    // ── PASS 1: AI trả lời với KB + user facts ──────────────
    const pass1System = buildSystemText(memory, kbContext, '');
    const pass1Messages: ChatMessage[] = [
      { role: 'system', content: pass1System },
      ...history.slice(-20),
      { role: 'user', content: message },
    ];
    let finalReply = '';
    let searched = false;

    try {
      finalReply = await callAI(pass1Messages, provider, aiConfig);
    } catch (err) {
      // Fallback: nếu provider thất bại, thử Ollama local
      console.error(`[ai-chat] ${provider} failed:`, err);
      try {
        finalReply = await callAI(pass1Messages, 'ollama', aiConfig);
        finalReply += '\n\n---\n⚠️ *' + `${provider} không khả dụng, đã dùng Ollama local.` + '*';
      } catch {
        throw new Error(`${provider} không khả dụng và Ollama cũng không chạy. Vào Settings > AI Provider để cấu hình.`);
      }
    }

    // ── Nếu AI không biết → search web + nén + retry ─────────
    const shouldSearch = forceSearch ?? true;
    if (shouldSearch && provider === 'ollama' && looksLikeUnknown(finalReply)) {
      console.log(`[ai-chat] AI không biết → search web: "${message.slice(0, 80)}"`);

      const { results } = await searchWeb(message);
      if (results.length > 0) {
        searched = true;
        const webContext = formatSearchContext(message, results);
        console.log(`[ai-chat] Web OK (${results.length} kết quả), retry AI...`);

        // PASS 2: Gửi lại AI với KB + web context
        const pass2System = buildSystemText(memory, kbContext, webContext);
        const pass2Messages: ChatMessage[] = [
          { role: 'system', content: pass2System },
          ...history.slice(-20),
          { role: 'user', content: message },
        ];
        finalReply = await callAI(pass2Messages, provider, aiConfig);

        // ── Tự động nén vào memory ──────────────────────────
        const note = compressToMemoryNote(message, results);
        if (note) {
          memory = recordPromptTip(memory, note);
          await svc.from('settings').upsert(
            { key: 'ai_memory', value: memory },
            { onConflict: 'key' },
          );
          console.log(`[ai-chat] Đã lưu vào memory: "${note.slice(0, 80)}"`);
        }
      } else {
        console.log(`[ai-chat] Không có kết quả web, giữ reply gốc`);
      }
    }

    return NextResponse.json({ reply: finalReply, searched, provider });
  } catch (e) {
    console.error('[ai-chat] Error:', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ─── GET memory ────────────────────────────────────────────────

export async function GET() {
  try {
    await requireAdmin();
    const svc = createSupabaseServiceClient() as Db;
    const { data } = await svc
      .from('settings').select('value').eq('key', 'ai_memory').single();
    return NextResponse.json({ memory: data?.value || createEmptyMemory() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ─── DELETE memory ─────────────────────────────────────────────

export async function DELETE() {
  try {
    await requireAdmin();
    const svc = createSupabaseServiceClient() as Db;
    await svc.from('settings').upsert(
      { key: 'ai_memory', value: createEmptyMemory() },
      { onConflict: 'key' },
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
