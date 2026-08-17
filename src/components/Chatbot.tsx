/**
 * Chatbot — floating AI assistant.
 *
 * Behavior:
 *   1. FAB opens the panel.
 *   2. Keyword hits answer instantly from the local knowledge base.
 *   3. Anything else POSTs to /api/chat. Empty / redirected / hung
 *      responses fall back to the same static matcher.
 *   4. Show a small status pill indicating which source answered.
 *
 * Mounted via createPortal(document.body) so fixed positioning is never
 * trapped by astro-island (display:contents / zero-box hacks).
 * Styles live in global.css.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { findStaticReply } from '@data/knowledge';

type Msg = {
  role: 'user' | 'assistant';
  content: string;
  source?: 'agnes' | 'static' | 'fallback';
};

type ChatPayload = {
  reply?: unknown;
  source?: Msg['source'];
};

const SUGGESTIONS = [
  '介绍下你自己',
  '有哪些项目',
  '最近在干嘛',
  '户外运动',
];

const API_TIMEOUT_MS = 8000;

const sourceLabel = (s?: Msg['source']) => {
  switch (s) {
    case 'agnes':
      return 'AI';
    case 'static':
      return '';
    case 'fallback':
      return '';
    default:
      return '';
  }
};

function localStaticReply(input: string): string {
  const entry = findStaticReply(input);
  if (entry) return entry.reply;
  return '这个问题我不知道。换个问法试试 —— 比如"有哪些项目"、"最近在干嘛"、"滑雪"。';
}

function parseChatPayload(data: ChatPayload): { reply: string; source?: Msg['source'] } | null {
  if (typeof data?.reply !== 'string') return null;
  const reply = data.reply.trim();
  if (!reply) return null;
  return { reply, source: data.source };
}

async function requestChatReply(messages: Msg[], signal: AbortSignal): Promise<{ reply: string; source?: Msg['source'] }> {
  const res = await fetch('/api/chat/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
    signal,
    // A 301/302/308 (apex→www, trailing-slash) can turn this POST into a
    // GET. The GET handler returns {ok:true} with no `reply`, which used
    // to render as an empty gray bubble. Fail the fetch instead.
    redirect: 'error',
  });

  if (!res.ok) throw new Error(`http ${res.status}`);

  let data: ChatPayload;
  try {
    data = await res.json();
  } catch {
    throw new Error('invalid json');
  }

  const parsed = parseChatPayload(data);
  if (!parsed) throw new Error('empty reply');
  return parsed;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content: '你好，我是 lazy 的 AI 助手。问我关于我、最近在做什么都行 :)',
      source: 'static',
    },
  ]);
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, open, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const focusId = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(focusId);
    };
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);

    // Known questions answer locally — never wait on /api/chat for these.
    const instant = findStaticReply(trimmed);
    if (instant) {
      setMessages([
        ...next,
        { role: 'assistant', content: instant.reply, source: 'static' },
      ]);
      return;
    }

    const id = ++requestId.current;
    setBusy(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const data = await requestChatReply(next, controller.signal);
      if (id !== requestId.current) return;
      setMessages([
        ...next,
        { role: 'assistant', content: data.reply, source: data.source },
      ]);
    } catch (err) {
      if (id !== requestId.current) return;
      console.warn('[chatbot] api failed, using static fallback:', err);
      setMessages([
        ...next,
        { role: 'assistant', content: localStaticReply(trimmed), source: 'static' },
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      if (id === requestId.current) setBusy(false);
    }
  }

  return createPortal(
    <div className="chat-root">
      <button
        type="button"
        className={`chat-fab${open ? ' is-hidden' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="打开聊天助手"
        aria-expanded={open}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <div
        className={`chat-panel${open ? ' is-open' : ''}`}
        role="dialog"
        aria-label="AI 聊天助手"
        aria-hidden={!open}
        inert={!open}
      >
        <header className="chat-panel__head">
          <div>
            <p className="chat-panel__title">lazy · AI 助手</p>
            <p className="chat-panel__sub">问项目、近况、户外</p>
          </div>
          <button
            type="button"
            className="chat-panel__close"
            onClick={() => setOpen(false)}
            aria-label="关闭"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 4L16 16M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div
          className="chat-panel__scroll"
          ref={scrollerRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg chat-msg--${m.role}`}>
              <div className="chat-msg__bubble">{m.content}</div>
              {m.role === 'assistant' && sourceLabel(m.source) && i > 0 && (
                <p className="chat-msg__meta">{sourceLabel(m.source)}</p>
              )}
            </div>
          ))}
          {busy && (
            <div className="chat-msg chat-msg--assistant">
              <div
                className="chat-msg__bubble chat-msg__bubble--typing"
                aria-label="正在回复"
              >
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="chat-panel__suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="chat-panel__chip"
                onClick={() => send(s)}
                disabled={busy}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          className="chat-panel__form"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问点什么..."
            aria-label="输入消息"
            disabled={busy}
          />
          <button type="submit" disabled={busy || !input.trim()} aria-label="发送">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
