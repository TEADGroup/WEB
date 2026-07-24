import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_DIR = path.join(__dirname, '..');
const STORE_PATH = path.join(STORE_DIR, 'pending.json');

export interface PendingRequest {
  id: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  status: 'pending' | 'approved' | 'denied' | 'timed_out';
  response: string | null;
  createdAt: number;
  respondedAt: number | null;
}

export interface RemoteCommand {
  id: string;
  text: string;
  status: 'pending' | 'executed';
  createdAt: number;
}

interface Store {
  requests: Record<string, PendingRequest>;
  commands: RemoteCommand[];
}

function load(): Store {
  try {
    if (!existsSync(STORE_PATH)) return { requests: {}, commands: [] };
    const raw = readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { requests: {}, commands: [] };
  }
}

function save(store: Store): void {
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

/* ─── Approval requests ─── */

export function createRequest(id: string, toolName: string, toolInput: Record<string, unknown>): void {
  const store = load();
  store.requests[id] = {
    id,
    toolName,
    toolInput,
    status: 'pending',
    response: null,
    createdAt: Math.floor(Date.now() / 1000),
    respondedAt: null,
  };
  save(store);
}

export function getRequest(id: string): PendingRequest | null {
  const store = load();
  return store.requests[id] || null;
}

export function updateResponse(id: string, status: 'approved' | 'denied', response: string): void {
  const store = load();
  const req = store.requests[id];
  if (req) {
    req.status = status;
    req.response = response;
    req.respondedAt = Math.floor(Date.now() / 1000);
  }
  save(store);
}

/* ─── Remote commands (Telegram → Claude Code) ─── */

export function addCommand(text: string): string {
  const store = load();
  const id = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  store.commands.push({ id, text, status: 'pending', createdAt: Math.floor(Date.now() / 1000) });
  save(store);
  return id;
}

export function getPendingCommands(): RemoteCommand[] {
  const store = load();
  return (store.commands || []).filter((c) => c.status === 'pending');
}

export function markCommandExecuted(id: string): void {
  const store = load();
  const cmd = store.commands.find((c) => c.id === id);
  if (cmd) cmd.status = 'executed';
  save(store);
}

export function cleanupOld(olderThanSeconds = 3600): void {
  const store = load();
  const now = Math.floor(Date.now() / 1000);
  let changed = false;
  for (const id of Object.keys(store.requests)) {
    if (now - store.requests[id].createdAt > olderThanSeconds) {
      delete store.requests[id];
      changed = true;
    }
  }
  store.commands = store.commands.filter((c) => now - c.createdAt < olderThanSeconds);
  if (changed) save(store);
}
