// Unit tests for pure logic.

import { describe, it, expect } from 'vitest';
import { findStaticReply, knowledge } from '../../data/knowledge';
import {
  projects,
  categoryMeta,
  getFeaturedProjects,
  getHomeFeaturedProjects,
  getComingSoonProjects,
} from '../../data/projects';
import type { ProjectCategory } from '../../data/projects';
import { nowEntries, getLatestNowEntry } from '../../data/now';
import { personalTools } from '../../data/personal';

describe('knowledge base', () => {
  it('has at least 10 entries', () => {
    expect(knowledge.length).toBeGreaterThanOrEqual(10);
  });

  it('findStaticReply matches a known keyword', () => {
    const reply = findStaticReply('你是谁');
    expect(reply?.id).toBe('about');
  });

  it('findStaticReply matches the homepage intro chip', () => {
    const reply = findStaticReply('介绍下你自己');
    expect(reply?.id).toBe('about');
    expect(reply?.reply.length).toBeGreaterThan(0);
  });

  it('findStaticReply returns null for unrelated query', () => {
    const reply = findStaticReply('asdfghjkl zzz no keywords here');
    expect(reply).toBeNull();
  });

  it('distinguishes this website from the personal technology stack', () => {
    expect(findStaticReply('你这个网站是用什么做的？')?.id).toBe('site');
    expect(findStaticReply('你的技术栈是什么')?.id).toBe('tech');
  });

  it.each(['你着牛头不对马嘴啊', '你的项目为什么不用 React', '用什么', '介绍一下 Astro 的缺点', '你最近说的项目和之前的有什么区别'])('does not replace a free-form question with a keyword template: %s', input => {
    expect(findStaticReply(input)).toBeNull();
  });

  it('findStaticReply is case-insensitive', () => {
    const reply = findStaticReply('HELLO');
    expect(reply).not.toBeNull();
  });

  it('does not treat Linux as a contact match for the letter x', () => {
    expect(findStaticReply('Linux')).toBeNull();
  });

  it('does not treat "this" as a greeting', () => {
    expect(findStaticReply('this')).toBeNull();
  });

  it('prefers projects when asked to introduce the projects', () => {
    expect(findStaticReply('介绍你的项目')?.id).toBe('projects');
  });

  it('does not treat 证书 as a book match', () => {
    expect(findStaticReply('有什么证书')).toBeNull();
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
    expect(featured.map((p) => p.name)).toEqual(
      expect.arrayContaining([
        'home-nas-skill',
        'llm-quota-watchdog',
        'AquaSight',
        'web3_learning',
      ]),
    );
    expect(featured[0]?.name).toBe('home-nas-skill');
    expect(featured.map((p) => p.name)).not.toContain('lodge');
    for (const p of featured) {
      expect(p.status).toBe('shipped');
    }
    for (const p of projects.filter((p) => p.featured)) {
      expect(p.status).toBe('shipped');
    }
  });

  it('homepage featured is three current products', () => {
    const home = getHomeFeaturedProjects();
    expect(home.map((p) => p.name)).toEqual([
      'home-nas-skill',
      'AquaSight',
      'metronome',
    ]);
    for (const p of home) {
      if (p.image && p.wechat) {
        expect(p.image).not.toBe(p.wechat.qr);
      }
    }
    expect(home.find((p) => p.name === 'metronome')?.image).toBeUndefined();
  });

  it('coming soon section holds the named wip products', () => {
    const soon = getComingSoonProjects();
    expect(soon.map((p) => p.name)).toEqual([
      'MediaForge',
      'xiaohei-phone-agent',
      'gridgo-art-studio',
      'gridgo-pet-school',
      'lodge',
    ]);
    for (const p of soon) {
      expect(p.status).toBe('wip');
    }
    expect(projects.find((p) => p.name === 'web3_learning')?.status).toBe('shipped');
    expect(projects.find((p) => p.name === 'plutus-rustus')).toBeUndefined();
    expect(getFeaturedProjects().map((p) => p.name)).not.toContain('plutus-rustus');
  });

  it('personal tools stay out of featured', () => {
    const featuredNames = getFeaturedProjects().map((p) => p.name);
    for (const tool of personalTools) {
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.url).toMatch(/^https?:\/\//);
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
  it('getLatestNowEntry uses the newest date even if storage is shuffled', () => {
    const shuffled = [nowEntries[2], nowEntries[0], nowEntries[1]].filter(
      (e): e is (typeof nowEntries)[number] => e != null,
    );
    expect(getLatestNowEntry(shuffled)?.date).toBe(
      [...nowEntries].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.date,
    );
  });

  it('every entry has date, title, body', () => {
    for (const e of nowEntries) {
      expect(e.date).toMatch(/^\d{4}-\d{2}$/);
      expect(e.title).toBeTruthy();
      expect(e.body.length).toBeGreaterThan(0);
    }
  });
});
