// Unit tests for pure logic. Three.js / DOM behavior is exercised in-browser.

import { describe, it, expect } from 'vitest';
import { findStaticReply, knowledge } from '../../data/knowledge';
import { memories, getMemory } from '../../data/memories';
import { works } from '../../data/works';
import { nowEntries } from '../../data/now';

describe('memories', () => {
  it('has exactly 4 memories', () => {
    expect(memories).toHaveLength(4);
  });

  it('every memory has a valid lat/lon', () => {
    for (const m of memories) {
      expect(m.lat).toBeGreaterThanOrEqual(-90);
      expect(m.lat).toBeLessThanOrEqual(90);
      expect(m.lon).toBeGreaterThanOrEqual(-180);
      expect(m.lon).toBeLessThanOrEqual(180);
    }
  });

  it('getMemory returns the right entry by id', () => {
    expect(getMemory('beijing')?.title).toContain('北京');
    expect(getMemory('xinjiang')?.title).toContain('新疆');
  });

  it('getMemory returns undefined for unknown id', () => {
    expect(getMemory('atlantis')).toBeUndefined();
  });

  it('every memory has a unique id and a photo path', () => {
    const ids = new Set<string>();
    for (const m of memories) {
      expect(ids.has(m.id)).toBe(false);
      ids.add(m.id);
      expect(m.photo).toMatch(/^\/photos\/.+\.jpg$/);
    }
  });
});

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
  it('has exactly 6 works', () => {
    expect(works).toHaveLength(6);
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