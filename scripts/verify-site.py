#!/usr/bin/env python3
"""Dependency-free checks against the actual static output, not source templates."""
from __future__ import annotations

import base64
import hashlib
import gzip
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


# Frozen attachments, not Astro pages. Keep their original markup and URLs;
# still validate every local file/anchor reference. Do not extend automatically.
LEGACY_ATTACHMENTS = {
    'posts-legacy/xmr.html', 'posts-legacy/xmr70.html',
    'posts-legacy/xmrsimple.html', 'posts-legacy/Git-Cheet-Sheet/freemind.html',
}

class Page(HTMLParser):
    def __init__(self, html: str):
        super().__init__(convert_charrefs=True)
        self.ids: set[str] = set()
        self.refs: list[str] = []
        self.canonical: list[str] = []
        self.h1 = self.main = 0
        self.title = ''
        self.description = ''
        self.lang = ''
        self.csp = ''
        self.inline_scripts = []
        self.active_script = None
        self.robots = ''
        self.redirect = False
        self.errors: list[str] = []
        self.json_ld: list[str] = []
        self.in_title = self.in_json = False
        self.feed(html)
        self.close()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for key in ('id', 'name'):
            if a.get(key):
                self.ids.add(a[key])
        self.h1 += tag == 'h1'
        self.main += tag == 'main'
        if tag == 'html':
            self.lang = a.get('lang', '')
        if tag == 'title':
            self.in_title = True
        if tag == 'meta':
            if a.get('name') == 'description': self.description = a.get('content', '')
            if a.get('name') == 'robots': self.robots = a.get('content', '')
            if a.get('http-equiv', '').lower() == 'refresh': self.redirect = True
            if a.get('http-equiv', '').lower() == 'content-security-policy': self.csp = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical.append(a.get('href', ''))
        if tag == 'iframe' and not a.get('title'):
            self.errors.append('iframe missing title')
        if tag in ('iframe', 'script', 'img', 'audio', 'video') and a.get('src', '').startswith('http://'):
            self.errors.append('insecure mixed-content resource')
        if tag == 'img' and 'alt' not in a:
            self.errors.append('image missing alt attribute')
        if any(key.lower().startswith('on') for key in a): self.errors.append('inline event handler forbidden by CSP')
        if tag == 'script' and not a.get('src') and a.get('type', '') in ('', 'module', 'text/javascript', 'application/javascript'):
            self.active_script = ''
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self.in_json = True
            self.json_ld.append('')
        if a.get('srcset') and not a['srcset'].startswith('data:'):
            self.refs.extend(item.strip().split()[0] for item in a['srcset'].split(',') if item.strip())
        for key in ('src', 'href'):
            if a.get(key): self.refs.append(a[key])

    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'script':
            self.in_json = False
            if self.active_script is not None: self.inline_scripts.append(self.active_script)
            self.active_script = None

    def handle_data(self, data):
        if self.active_script is not None: self.active_script += data
        if self.in_title: self.title += data
        if self.in_json: self.json_ld[-1] += data


def verify(root: Path) -> tuple[list[str], dict]:
    pages = {p: Page(p.read_text(encoding='utf-8')) for p in root.rglob('*.html')}
    errors: list[str] = []
    if not pages:
        return ['No built HTML found. Run npm run build first.'], {}
    # Canonical hosts also support PUBLIC_SITE_URL overrides. Legacy hosts stay local.
    hosts = {'www.weichao.ren', 'weichao.ren'}
    hosts.update(urlsplit(c).netloc for page in pages.values() for c in page.canonical)
    checked_links = 0
    for file, page in pages.items():
        relative = file.relative_to(root).as_posix()
        path = '/' + relative.removesuffix('index.html')
        base = 'https://www.weichao.ren' + path
        def fail(message): errors.append(f'{relative}: {message}')
        if not page.redirect and relative not in LEGACY_ATTACHMENTS:
            for error in page.errors: fail(error)
            if page.h1 != 1: fail(f'expected 1 h1, got {page.h1}')
            if page.main != 1: fail(f'expected 1 main, got {page.main}')
            if not page.lang: fail('missing document language')
            directives = {bits[0]: bits[1:] for item in page.csp.split(';') if (bits := item.split())}
            script_sources = directives.get('script-src', [])
            if "'self'" not in script_sources or any(x in script_sources for x in ("'unsafe-inline'", "'unsafe-eval'", '*', 'https:')):
                fail('missing or permissive script CSP')
            if directives.get('script-src-attr') != ["'none'"]: fail('CSP must forbid inline handlers')
            for script in page.inline_scripts:
                digest = base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
                if f"'sha256-{digest}'" not in script_sources: fail('inline script missing CSP hash')
            if not page.title.strip(): fail('missing title')
            if not page.description.strip(): fail('missing description')
            if relative == '404.html':
                if 'noindex' not in page.robots: fail('404 must be noindex')
            else:
                if len(page.canonical) != 1: fail('expected exactly one canonical')
                elif urlsplit(page.canonical[0]).path != path: fail('canonical differs from output path')
                if not page.json_ld: fail('missing structured data')
            for data in page.json_ld:
                try: json.loads(data)
                except ValueError: fail('invalid JSON-LD')
        for ref in page.refs:
            url = urlsplit(urljoin(base, ref))
            if url.scheme not in ('http', 'https') or url.netloc not in hosts: continue
            checked_links += 1
            target = root / unquote(url.path).lstrip('/')
            if target.is_dir(): target /= 'index.html'
            if not target.is_file():
                fail(f'missing local target: {ref}')
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                fail(f'missing anchor: {ref}')
    # Conservative total shipped-JS budget. Chat is lazy, so initial JS is lower.
    # Per-file gzip reflects separate HTTP responses (not one compressed archive).
    js_bytes = sum(len(gzip.compress(p.read_bytes())) for p in (root / '_astro').glob('*.js'))
    if js_bytes > 150 * 1024: errors.append(f'JS gzip budget exceeded: {js_bytes} > 153600 bytes')
    return errors, {'html_pages': len(pages), 'legacy_semantic_exemptions': sum(p.relative_to(root).as_posix() in LEGACY_ATTACHMENTS for p in pages), 'local_references': checked_links, 'total_js_gzip_bytes': js_bytes}


if __name__ == '__main__':
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'dist/client'
    errors, summary = verify(root)
    print(json.dumps({**summary, 'errors': errors}, ensure_ascii=False, indent=2))
    raise SystemExit(bool(errors))
