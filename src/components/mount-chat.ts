import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import Chatbot from './Chatbot';

export function mountChat(el: HTMLElement) {
  createRoot(el).render(createElement(Chatbot, { startOpen: true }));
}
