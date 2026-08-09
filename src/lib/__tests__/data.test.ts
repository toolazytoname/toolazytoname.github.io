// Unit tests for pure logic.

import { describe, it, expect } from 'vitest';
import { findStaticReply, knowledge } from '../../data/knowledge';
import { works } from '../../data/works';
import { nowEntries } from '../../data/now';

describe('knowledge base', () => {
  it('has at least 10 entries', () => {
    expect(knowledge.length).toBeGreaterThanOrEqual(10);
  });

  it('findStaticReply matches a known keyword', () => {
    const reply = findStaticReply('你是谁');
    expect(reply?.id).toBe('about');
  });

  it('findStaticReply returns null for unrelated query', () => {
    const reply = findStaticReply('asdfghjkl zzz no keywords here');
    expect(reply).toBeNull();
  });

  it('findStaticReply is case-insensitive', () => {
    const reply = findStaticReply('HELLO');
    expect(reply).not.toBeNull();
  });

  it('every entry has non-empty keywords and reply', () => {
    for (const e of knowledge) {
      expect(e.keywords.length).toBeGreaterThan(0);
      expect(e.reply.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('works', () => {
  it('has exactly 3 works', () => {
    expect(works).toHaveLength(3);
  });

  it('every work has front and back detail', () => {
    for (const w of works) {
      expect(w.title).toBeTruthy();
      expect(w.front.highlights.length).toBeGreaterThan(0);
      expect(w.back.problem.length).toBeGreaterThan(0);
      expect(w.back.approach.length).toBeGreaterThan(0);
      expect(w.back.outcome.length).toBeGreaterThan(0);
      expect(w.back.stack.length).toBeGreaterThan(0);
    }
  });
});

describe('now entries', () => {
  it('is sorted chronologically (oldest first)', () => {
    const dates = nowEntries.map((e) => e.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });

  it('every entry has date, title, body', () => {
    for (const e of nowEntries) {
      expect(e.date).toMatch(/^\d{4}-\d{2}$/);
      expect(e.title).toBeTruthy();
      expect(e.body.length).toBeGreaterThan(0);
    }
  });
});