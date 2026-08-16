// Unit tests for pure logic.

import { describe, it, expect } from 'vitest';
import { findStaticReply, knowledge } from '../../data/knowledge';
import { projects, categoryMeta, getFeaturedProjects } from '../../data/projects';
import type { ProjectCategory } from '../../data/projects';
import { nowEntries } from '../../data/now';
import { personalTools } from '../../data/personal';

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

  it('featured projects are shipped products only', () => {
    const featured = getFeaturedProjects();
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.map((p) => p.name)).toEqual(
      expect.arrayContaining(['llm-quota-watchdog', 'AquaSight']),
    );
    for (const p of featured) {
      expect(p.status).toBe('shipped');
    }
    for (const p of projects.filter((p) => p.featured)) {
      expect(p.status).toBe('shipped');
    }
  });

  it('personal tools stay out of featured', () => {
    const featuredNames = getFeaturedProjects().map((p) => p.name);
    for (const tool of personalTools) {
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.url).toMatch(/^https:\/\//);
      expect(featuredNames).not.toContain(tool.name);
    }
  });

  it('wechat qr projects have a local image path', () => {
    for (const p of projects) {
      if (p.wechat) {
        expect(p.wechat.qr).toMatch(/^\//);
        expect(p.wechat.name.length).toBeGreaterThan(0);
      }
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