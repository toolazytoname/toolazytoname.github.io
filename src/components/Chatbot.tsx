/**
 * Chatbot — floating AI assistant.
 *
 * Behavior:
 *   1. FAB opens the panel.
 *   2. POST to /api/chat with the full conversation.
 *   3. On any network / server error → fall back to local static matcher.
 *   4. Show a small status pill indicating which source answered.
 *
 * Loaded via client:idle — defers JS until the browser is free.
 */

import { useEffect, useRef, useState } from 'react';
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
      return '🟢 Agnes';
    case 'static':
      return '⚪ static';
    case 'fallback':
      return '⚪ fallback';
    default:
      return '';
  }
};

// Client-side fallback when /api/chat itself is down (cold start, CORS, 500).
// Uses the SAME knowledge.ts as the server — single source of truth.
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

  // Close on ESC.
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

    // 12s client-side timeout — if the API hasn't responded by then,
    // abort and use the local keyword matcher so the user isn't stuck
    // staring at typing dots.
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

  return (
    <>
      <button
        type="button"
        className={`chat-fab ${open ? 'is-hidden' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="打开聊天助手"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="chat-fab__pulse" />
      </button>

      <div
        className={`chat-panel ${open ? 'is-open' : ''}`}
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
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </div>

      <style>{`
        .chat-fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--color-terracotta);
          color: var(--color-ivory);
          display: grid;
          place-items: center;
          z-index: var(--z-fab);
          box-shadow: 0 8px 24px rgba(14, 165, 233, 0.35);
          transition: transform 200ms var(--ease-out), opacity 200ms;
        }
        .chat-fab:hover { transform: scale(1.06); }
        .chat-fab.is-hidden { opacity: 0; pointer-events: none; transform: scale(0.8); }
        .chat-fab__pulse {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid var(--color-terracotta);
          animation: chat-pulse 2.2s ease-out infinite;
          pointer-events: none;
        }
        @keyframes chat-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .chat-panel {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: min(380px, calc(100vw - 32px));
          height: min(560px, calc(100vh - 48px));
          background: var(--color-ivory);
          border: 1px solid var(--color-warm-border);
          border-radius: var(--r-xl);
          box-shadow: 0 20px 60px rgba(20, 20, 19, 0.2);
          display: flex;
          flex-direction: column;
          z-index: var(--z-fab);
          opacity: 0;
          transform: translateY(20px) scale(0.96);
          pointer-events: none;
          transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out);
        }
        .chat-panel.is-open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .chat-panel__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-warm-border);
        }
        .chat-panel__title {
          margin: 0;
          font-family: var(--font-serif);
          font-weight: 500;
          font-size: 16px;
          color: var(--color-warm-text);
        }
        .chat-panel__sub {
          margin: 2px 0 0;
          font-size: 11px;
          color: var(--color-warm-text-dim);
        }
        .chat-panel__close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: var(--color-warm-text-muted);
          transition: background 150ms;
        }
        .chat-panel__close:hover {
          background: var(--color-warm-sand);
        }

        .chat-panel__scroll {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-msg { display: flex; flex-direction: column; max-width: 88%; }
        .chat-msg--user { align-self: flex-end; align-items: flex-end; }
        .chat-msg--assistant { align-self: flex-start; }

        .chat-msg__bubble {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.55;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .chat-msg--user .chat-msg__bubble {
          background: var(--color-terracotta);
          color: var(--color-ivory);
          border-bottom-right-radius: 4px;
        }
        .chat-msg--assistant .chat-msg__bubble {
          background: var(--color-warm-sand);
          color: var(--color-warm-text);
          border-bottom-left-radius: 4px;
        }
        .chat-msg__bubble--typing {
          display: flex;
          gap: 4px;
          padding: 14px 14px;
        }
        .chat-msg__bubble--typing span {
          width: 6px;
          height: 6px;
          background: var(--color-warm-text-dim);
          border-radius: 50%;
          animation: typing 1.2s infinite;
        }
        .chat-msg__bubble--typing span:nth-child(2) { animation-delay: 0.2s; }
        .chat-msg__bubble--typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }

        .chat-msg__meta {
          margin: 4px 0 0;
          font-size: 10px;
          color: var(--color-warm-text-dim);
        }

        .chat-panel__suggestions {
          padding: 0 16px 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .chat-panel__chip {
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 980px;
          background: var(--color-warm-sand);
          color: var(--color-warm-text-muted);
          transition: background 150ms;
        }
        .chat-panel__chip:hover { background: var(--color-warm-border); }

        .chat-panel__form {
          display: flex;
          gap: 8px;
          padding: 12px 16px 16px;
          border-top: 1px solid var(--color-warm-border);
        }
        .chat-panel__form input {
          flex: 1;
          padding: 10px 14px;
          background: var(--color-warm-sand);
          border: 1px solid transparent;
          border-radius: var(--r-pill);
          font-size: 14px;
          color: var(--color-warm-text);
          font-family: inherit;
          transition: border-color 150ms, background 150ms;
        }
        .chat-panel__form input:focus {
          background: var(--color-ivory);
          border-color: var(--color-terracotta);
          outline: none;
        }
        .chat-panel__form button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-terracotta);
          color: var(--color-ivory);
          display: grid;
          place-items: center;
          transition: background 150ms, opacity 150ms;
        }
        .chat-panel__form button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .chat-panel__form button:not(:disabled):hover {
          background: var(--color-coral);
        }
      `}</style>
    </>
  );
}
