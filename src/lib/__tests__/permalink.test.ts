import { describe, it, expect } from 'vitest';
import { postSlug } from '../permalink';

describe('postSlug', () => {
  it('keeps the historic Jekyll path for a normal dated filename', () => {
    expect(
      postSlug('2019-09-19-iOS-App-thin', {
        date: new Date('2019-09-19T17:24:32+08:00'),
        categories: 'iOS',
      }),
    ).toBe('ios/2019/09/19/iOS-App-thin');
  });

  it('does not eat the first character of a short-day filename', () => {
    expect(
      postSlug('2024-04-2-2024-okr', {
        date: new Date('2024-04-02T10:32:32+08:00'),
        categories: 'life',
      }),
    ).toBe('life/2024/04/02/2024-okr');
  });

  it('uses the first category when categories is an array', () => {
    expect(
      postSlug('2026-09-06-test', {
        date: new Date('2026-09-06T12:00:00+08:00'),
        categories: ['life', 'craft'],
      }),
    ).toBe('life/2026/09/06/test');
  });

  it('uses UTC date components, matching the previous permalink contract', () => {
    expect(
      postSlug('2016-05-19-welcome-to-jekyll', {
        date: new Date('2016-05-19T08:00:00+08:00'),
        categories: 'life',
      }),
    ).toBe('life/2016/05/19/welcome-to-jekyll');
  });
});
