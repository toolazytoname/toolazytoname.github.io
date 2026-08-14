/**
 * Chatbot — floating AI assistant.
 *
 * Behavior:
 *   1. FAB opens the panel.
 *   2. POST to /api/chat with the full conversation.
 *   3. On any network / server error → fall back to local static matcher.
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

const SUGGESTIONS = [
  '介绍下你自己',
  '有哪些项目',
  '最近在干嘛',
  '户外运动',
];

const sourceLabel = (s?: Msg['source']) => {
  switch (s) {
    case 'agnes':
      return 'Agnes';
    case 'static':
      return 'static';
    case 'fallback':
      return 'fallback';
    default:
      return '';
  }
};

function localStaticReply(input: string): string {
  const entry = findStaticReply(input);
  if (entry) return entry.reply;
  return '这个问题我不知道。换个问法试试 —— 比如"有哪些项目"、"最近在干嘛"、"滑雪"。';
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

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setBusy(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`http ${res.status}`);
      const data: { reply: string; source?: Msg['source'] } = await res.json();
      setMessages([
        ...next,
        { role: 'assistant', content: data.reply, source: data.source },
      ]);
    } catch (err) {
      console.warn('[chatbot] api failed, using static fallback:', err);
      setMessages([
        ...next,
        { role: 'assistant', content: localStaticReply(trimmed), source: 'static' },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setBusy(false);
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
      >
        <header className="chat-panel__head">
          <div>
            <p className="chat-panel__title">lazy · AI 助手</p>
            <p className="chat-panel__sub">Agnes + 静态兜底</p>
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

        <div className="chat-panel__scroll" ref={scrollerRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg chat-msg--${m.role}`}>
              <div className="chat-msg__bubble">{m.content}</div>
              {m.role === 'assistant' && m.source && i > 0 && (
                <p className="chat-msg__meta">{sourceLabel(m.source)}</p>
              )}
            </div>
          ))}
          {busy && (
            <div className="chat-msg chat-msg--assistant">
              <div className="chat-msg__bubble chat-msg__bubble--typing">
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
