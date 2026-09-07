/**
 * Chatbot — floating AI assistant.
 *
 * Send every question with history to the server for contextual answers.
 * Timeouts, 429s and upstream failures stay errors, not "I don't know".
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MAX_CONTENT_LENGTH } from '@lib/chat-request';
import { requestChatReply } from '@lib/chat-client';
import { historyBeforeRetry, lastRetryIndex } from '@lib/chat-retry';

type Msg = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  source?: 'agnes' | 'static' | 'fallback' | 'error';
  retryable?: boolean;
  retryText?: string;
};

const SUGGESTIONS = [
  '介绍下你自己',
  '有哪些项目',
  '最近在干嘛',
  '户外运动',
];

const API_TIMEOUT_MS = 12000;
const sourceLabel = (s?: Msg['source']) => {
  switch (s) {
    case 'agnes':
      return 'AI';
    case 'error':
      return '出错了';
    case 'static':
      return '站点问答';
    case 'fallback':
      return '备用答复';
    default:
      return '';
  }
};

function stripUrl(raw: string): string {
  return raw.replace(/[.,;:!?。，、；：！？)\]}）】》"'”’]+$/u, '');
}

function ChatText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const re =
    /(https?:\/\/[^\s\u3000-\u303F\uFF00-\uFFEF<>"']+)|(\/(?:projects|now|about|posts)[a-z0-9#/_-]*)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [full, url, path, email] = match;
    if (url) {
      const href = stripUrl(url);
      const consumed = href.length;
      const rest = url.slice(consumed);
      nodes.push(
        <a key={key++} href={href} target="_blank" rel="noopener">
          {href}
        </a>,
      );
      if (rest) nodes.push(rest);
      last = match.index + full.length;
      continue;
    }
    if (email) {
      nodes.push(
        <a key={key++} href={`mailto:${email}`}>
          {email}
        </a>,
      );
    } else if (path) {
      const href = path.endsWith('/') || path.includes('#') ? path : `${path}/`;
      nodes.push(
        <a key={key++} href={href}>
          {path}
        </a>,
      );
    } else {
      nodes.push(full);
    }
    last = match.index + full.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

export default function Chatbot({ startOpen = false }: { startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [input, setInput] = useState('');
  const [limitHint, setLimitHint] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 0,
      role: 'assistant',
      content: '你好，我是本站的 AI 助手。可以聊 lazy 的项目、近况，或者这个网站。',
      source: 'static',
    },
  ]);
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(1);
  const requestId = useRef(0);

  const lastRetryableIndex = lastRetryIndex(messages);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, open, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    const focusId = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(focusId);
    };
  }, [open]);

  function closePanel() {
    setOpen(false);
    window.setTimeout(() => fabRef.current?.focus(), 40);
  }

  function allocId() {
    const id = nextId.current;
    nextId.current += 1;
    return id;
  }

  async function send(text: string, history: Msg[] = messages) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (trimmed.length > MAX_CONTENT_LENGTH) {
      setLimitHint(true);
      return;
    }
    setLimitHint(false);
    setInput('');
    const next: Msg[] = [...history, { id: allocId(), role: 'user', content: trimmed }];
    setMessages(next);

    const id = ++requestId.current;
    setBusy(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const data = await requestChatReply(next, controller.signal);
      if (id !== requestId.current) return;
      if (data.ok) {
        setMessages([
          ...next,
          { id: allocId(), role: 'assistant', content: data.reply, source: data.source },
        ]);
      } else {
        setMessages([
          ...next,
          {
            id: allocId(),
            role: 'assistant',
            content: data.reply,
            source: 'error',
            retryable: data.retryable,
            retryText: trimmed,
          },
        ]);
      }
    } catch (err) {
      if (id !== requestId.current) return;
      const timedOut = err instanceof DOMException && err.name === 'AbortError';
      console.warn('[chatbot] api failed:', err);
      setMessages([
        ...next,
        {
          id: allocId(),
          role: 'assistant',
          content: timedOut
            ? '这次请求超时了。可以再试一次，或换个更具体的问题。'
            : '暂时连不上服务。检查网络后再试。',
          source: 'error',
          retryable: true,
          retryText: trimmed,
        },
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      if (id === requestId.current) {
        setBusy(false);
        const active = document.activeElement;
        if (active === document.body || active === inputRef.current) {
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
    }
  }

  function retryAt(index: number) {
    if (busy) return;
    const prepared = historyBeforeRetry(messages, index);
    if (!prepared) return;
    setMessages(prepared.history);
    void send(prepared.text, prepared.history);
  }

  return createPortal(
    <div className="chat-root">
      <button
        type="button"
        ref={fabRef}
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
            onClick={closePanel}
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
          tabIndex={0}
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((m, i) => (
            <div key={m.id} className={`chat-msg chat-msg--${m.role}`}>
              <div
                className={`chat-msg__bubble${m.source === 'error' ? ' chat-msg__bubble--error' : ''}`}
              >
                <ChatText text={m.content} />
              </div>
              {m.role === 'assistant' && sourceLabel(m.source) && i > 0 && (
                <p className="chat-msg__meta">{sourceLabel(m.source)}</p>
              )}
              {m.retryable && i === lastRetryableIndex && (
                <button
                  type="button"
                  className="chat-msg__retry"
                  onClick={() => retryAt(i)}
                  disabled={busy}
                >
                  重试
                </button>
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
            maxLength={MAX_CONTENT_LENGTH}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.length <= MAX_CONTENT_LENGTH) setLimitHint(false);
            }}
            placeholder="问点什么..."
            aria-label="输入消息"
            readOnly={busy}
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
        {limitHint && (
          <p className="chat-panel__hint">单条消息最多 {MAX_CONTENT_LENGTH} 字，缩短后再发。</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
