// Unit tests for pure logic.

import { describe, it, expect } from 'vitest';
import { findStaticReply, knowledge } from '../../data/knowledge';
import { projects, categoryMeta } from '../../data/projects';
import type { ProjectCategory } from '../../data/projects';
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

describe('projects', () => {
  const validCategories = Object.keys(categoryMeta) as ProjectCategory[];

  it('every project has a valid category', () => {
    for (const p of projects) {
      expect(validCategories).toContain(p.category);
    }
  });

  it('every category has at least one project', () => {
    for (const cat of validCategories) {
      const count = projects.filter((p) => p.category === cat).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it('every project has required fields', () => {
    for (const p of projects) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.repo).toMatch(/^https:\/\/github\.com\//);
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