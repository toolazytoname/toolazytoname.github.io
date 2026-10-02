#!/usr/bin/env python3
"""Read-only external href/src audit of built HTML; never edits historical sources.
No cookies/auth, bounded concurrency, public hosts only, HEAD + bounded GET fallback.
403/429/timeouts are indeterminate, NOT dead links. No body is stored.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import ipaddress
import json
from pathlib import Path
import socket
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit, urlunsplit, quote
from urllib.request import Request, build_opener, HTTPRedirectHandler, ProxyHandler

LOCAL_HOSTS = {'www.weichao.ren', 'weichao.ren'}

def public_url(url):
    u = urlsplit(url)
    if u.scheme not in ('https', 'http') or u.username or u.password or not u.hostname or u.port not in (None, 80, 443):
        raise ValueError('unsafe URL')
    addresses = socket.getaddrinfo(u.hostname, u.port or (443 if u.scheme == 'https' else 80), type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):
        raise ValueError('non-public destination')
    return url

class PublicRedirects(HTTPRedirectHandler):
    max_redirections = 4
    max_repeats = 2
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        # Metadata endpoints are not navigated; canonical is checked locally.
        for key in (['href'] if tag == 'a' else ['src'] if tag in ('img', 'iframe', 'video', 'audio', 'script') else []):
            raw = a.get(key, '')
            u = urlsplit(urljoin('https://www.weichao.ren/', raw))
            if u.scheme in ('http', 'https') and u.hostname not in LOCAL_HOSTS:
                # Escape non-ASCII paths without changing existing percent escapes.
                self.urls.add(urlunsplit((u.scheme, u.netloc, quote(u.path, safe='/%:@'), quote(u.query, safe='=&%/:?@+'), '')))

def classify(status):
    if 200 <= status < 300: return 'reachable'
    if status in (404, 410): return 'broken'
    return 'indeterminate'

def probe(url):
    start = time.monotonic()
    try:
        public_url(url)
        opener = build_opener(ProxyHandler({}), PublicRedirects())
        status = None
        final = url
        for method in ('HEAD', 'GET'):
            req = Request(url, method=method, headers={'User-Agent': 'weichao-site-link-audit/1.0', 'Range': 'bytes=0-1023'})
            try:
                with opener.open(req, timeout=8) as response:
                    status, final = response.status, response.url
                    if method == 'GET': response.read(1024)
            except HTTPError as e:
                status, final = e.code, e.url
                e.close()
            if status and (200 <= status < 300 or method == 'GET'): break
        return {'url': url, 'finalUrl': final, 'status': status, 'classification': classify(status), 'elapsedMs': round((time.monotonic() - start) * 1000)}
    except (OSError, URLError, ValueError) as e:
        return {'url': url, 'classification': 'indeterminate', 'error': type(e).__name__, 'elapsedMs': round((time.monotonic() - start) * 1000)}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default='dist/client')
    parser.add_argument('--output', default='.audit/external-links.json')
    parser.add_argument('--snapshot', default='src/data/external-link-health.json')
    args = parser.parse_args()
    refs = {}
    files = list(Path(args.root).rglob('*.html'))
    if not files: raise SystemExit('No built HTML. Run npm run build.')
    for file in files:
        page = Links(); page.feed(file.read_text())
        for url in page.urls: refs.setdefault(url, []).append(str(file.relative_to(args.root)))
    # Recheck temporarily disabled project links too, so recovery is discoverable.
    snapshot = Path(args.snapshot)
    if snapshot.is_file():
        for url in json.loads(snapshot.read_text()): refs.setdefault(url, ['[availability snapshot]'])
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(probe, sorted(refs)))
    for r in results: r['pages'] = refs[r['url']]
    counts = {key: sum(r['classification'] == key for r in results) for key in ('reachable', 'broken', 'indeterminate')}
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'uniqueUrls': len(results), 'summary': counts, 'results': results,
              'note': 'Availability only, not factual validation or safety endorsement. Historical content not modified. DNS can change between validation and connection; run only on trusted built content.'}
    output = Path(args.output); output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(counts))
    raise SystemExit(1 if counts['broken'] else 0)

if __name__ == '__main__': main()
