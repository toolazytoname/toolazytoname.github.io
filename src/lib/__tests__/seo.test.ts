import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '../seo';

describe('JSON-LD serialization', () => {
  it('cannot terminate the HTML script element', () => {
    const value = { title: '</script><script>alert(1)</script>', description: '中文 & symbols' };
    const result = serializeJsonLd(value);
    expect(result).not.toContain('<');
    expect(JSON.parse(result)).toEqual(value);
  });
});
