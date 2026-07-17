// store.js — session store with disk persistence (restore-on-return).
// Conversations, task status, and artifact links survive a server restart via a
// JSON snapshot under DATA_DIR (default server/data/state.json). Large binary
// buffers (uploads / generated exports) stay in memory only — their metadata
// persists so the UI can explain an expired artifact honestly.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as log from './log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_PATH = path.join(DATA_DIR, 'state.json');

const conversations = new Map(); // id -> {id, title, createdAt, updatedAt, feature, odSessionId, messages:[], wizard}
const tasks = new Map();         // taskId -> {id, conversationId, kind, format, phase, artifactId?, url?, error?, createdAt, updatedAt}

// ---------- persistence ----------
let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 400); // debounce bursts of writes
}
export function saveNow() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const state = {
      v: 2,
      savedAt: new Date().toISOString(),
      conversations: [...conversations.values()],
      tasks: [...tasks.values()],
      artifacts: [...exportsMap.values()].map(({ buffer, ...meta }) => ({ ...meta, expired: !buffer })),
    };
    fs.writeFileSync(STATE_PATH, JSON.stringify(state));
  } catch (e) {
    log.warn('store.save_failed', { error: e.message });
  }
}
function restore() {
  try {
    if (!fs.existsSync(STATE_PATH)) return;
    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    for (const c of state.conversations || []) conversations.set(c.id, c);
    for (const t of state.tasks || []) tasks.set(t.id, t);
    for (const a of state.artifacts || []) {
      // metadata-only restore: downloads for pre-restart artifacts report "expired"
      exportsMap.set(a.id, { ...a, buffer: null, expired: true });
    }
    log.info('store.restored', { conversations: conversations.size, tasks: tasks.size, artifacts: exportsMap.size });
  } catch (e) {
    log.warn('store.restore_failed', { error: e.message });
  }
}

// ---------- conversations ----------
export function createConversation({ title = 'New chat', feature = 'chat' } = {}) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const conv = { id, title, feature, createdAt: now, updatedAt: now, odSessionId: null, messages: [], wizard: null };
  conversations.set(id, conv);
  scheduleSave();
  return conv;
}

export function getConversation(id) { return conversations.get(id) || null; }

export function listConversations() {
  return [...conversations.values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(({ id, title, feature, createdAt, updatedAt }) => ({ id, title, feature, createdAt, updatedAt }));
}

export function touch(conv, fields = {}) {
  Object.assign(conv, fields, { updatedAt: new Date().toISOString() });
  scheduleSave();
}

export function addMessage(conv, msg) {
  const m = { id: crypto.randomUUID(), ts: new Date().toISOString(), ...msg };
  conv.messages.push(m);
  touch(conv);
  return m;
}

// ---------- artifact tasks (persisted status for long-running generation) ----------
export function createTask({ conversationId, kind, format }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const t = { id, conversationId, kind, format, phase: 'Queued', artifactId: null, url: null, error: null, createdAt: now, updatedAt: now };
  tasks.set(id, t);
  scheduleSave();
  return t;
}
export function updateTask(id, fields) {
  const t = tasks.get(id);
  if (!t) return null;
  Object.assign(t, fields, { updatedAt: new Date().toISOString() });
  scheduleSave();
  return t;
}
export function getTask(id) { return tasks.get(id) || null; }
export function listTasks(conversationId) {
  return [...tasks.values()].filter(t => !conversationId || t.conversationId === conversationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------- uploaded files (in-memory, session-scoped) ----------
const files = new Map(); // fileId -> {id,name,mime,size,buffer,text}
export function putFile(f) { files.set(f.id, f); return f; }
export function getFile(id) { return files.get(id) || null; }

// ---------- generated exports ----------
const exportsMap = new Map(); // exportId -> {id,name,mime,buffer|null,createdAt,citations,gaps,expired?}
export function putExport(e) { exportsMap.set(e.id, e); scheduleSave(); return e; }
export function getExport(id) { return exportsMap.get(id) || null; }

restore();
