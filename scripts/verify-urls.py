#!/usr/bin/env python3
"""Verify post permalinks against a frozen public-URL list and built output.

Uses the same UTC date + first-category rules as src/lib/permalink.ts.
categories: [life, craft] is treated as an array, not the string "life/craft".
Redirect fixtures must appear in vercel.json or astro.config.mjs.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "src" / "content" / "posts"
DIST_DIR = ROOT / "dist" / "client"
FIXTURE_FILE = Path(__file__).resolve().parent / "fixtures" / "published-urls.txt"
MIGRATION_BASELINE = 61

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n(.*)", re.DOTALL)
KV_RE = re.compile(r"^(\s*)([\w-]+):\s*(.*)$")
LIST_ITEM_RE = re.compile(r"^\s*-\s*(.*)$")
DATE_PREFIX_RE = re.compile(r"^\d{4}-\d{1,2}-\d{1,2}-(.+)$")
BRACKET_LIST_RE = re.compile(r"^\[(.*)\]$")


def strip_yaml_comment(value: str) -> str:
    """Drop an unquoted # comment. `categories: [life, craft] # notes` stays a list."""
    in_single = False
    in_double = False
    for i, ch in enumerate(value):
        if ch == "'" and not in_double:
            in_single = not in_single
        elif ch == '"' and not in_single:
            in_double = not in_double
        elif ch == "#" and not in_single and not in_double:
            return value[:i].rstrip()
    return value


def parse_scalar(value: str):
    value = strip_yaml_comment(value.strip())
    m = BRACKET_LIST_RE.match(value)
    if m:
        return [part.strip().strip('"').strip("'") for part in m.group(1).split(",") if part.strip()]
    return value.strip().strip('"').strip("'")


def parse_frontmatter(raw: str) -> dict:
    m = FRONTMATTER_RE.match(raw)
    if not m:
        return {}
    fm: dict = {}
    cur_key: str | None = None
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        if LIST_ITEM_RE.match(line) and cur_key is not None:
            item = strip_yaml_comment(LIST_ITEM_RE.match(line).group(1).strip()).strip('"').strip("'")
            if not isinstance(fm.get(cur_key), list):
                fm[cur_key] = []
            fm[cur_key].append(item)
            continue
        kv = KV_RE.match(line)
        if kv:
            indent, key, value = kv.groups()
            if indent == "":
                cur_key = key
                fm[key] = parse_scalar(value)
    return fm


def category_path(cat: str) -> str:
    segs = [s for s in re.split(r"\s+", cat.lower().strip()) if s]
    segs = [re.sub(r"[^a-z0-9]", "", s) for s in segs]
    segs = [s for s in segs if s]
    return "/".join(segs)


def filename_slug(id_stem: str) -> str:
    m = DATE_PREFIX_RE.match(id_stem)
    if m:
        return m.group(1)
    return id_stem[11:] if len(id_stem) > 11 else id_stem


def utc_ymd(date_str: str) -> tuple[str, str, str] | None:
    raw = date_str.strip()
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw)
    except ValueError:
        m = re.match(r"(\d{4})-(\d{2})-(\d{2})", raw)
        if not m:
            return None
        return m.groups()
    utc = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)
    return f"{utc.year:04d}", f"{utc.month:02d}", f"{utc.day:02d}"


def post_url(id_stem: str, fm: dict) -> str:
    cats = fm.get("categories", "")
    if isinstance(cats, list):
        cat = cats[0] if cats else ""
    else:
        cat = cats
    cat_path = category_path(str(cat)) or "uncategorized"
    ymd = utc_ymd(str(fm.get("date", "")))
    if not ymd:
        return f"<BAD-DATE:{fm.get('date')}>/{cat_path}"
    y, mo, d = ymd
    return f"{cat_path}/{y}/{mo}/{d}/{filename_slug(id_stem)}/"


def load_fixtures() -> tuple[list[str], dict[str, str], list[str]]:
    pages: list[str] = []
    redirects: dict[str, str] = {}
    feeds: list[str] = []
    if not FIXTURE_FILE.exists():
        return pages, redirects, feeds
    for line in FIXTURE_FILE.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        kind, _, rest = stripped.partition(" ")
        rest = rest.strip()
        if kind == "REDIRECT":
            src, _, dest = rest.partition("->")
            redirects[src.strip()] = dest.strip()
        elif kind == "FEED":
            feeds.append(rest)
        else:
            pages.append(rest if rest.endswith("/") else rest + "/")
    return pages, redirects, feeds


HREF_RE = re.compile(r"""(?:href|src)=["']([^"']+)["']""", re.I)
SKIP_HREF_PREFIXES = (
    "http://",
    "https://",
    "mailto:",
    "data:",
    "javascript:",
    "tel:",
    "/_astro/",
    "/_image/",
)


def iter_broken_internal_links(configured: dict[str, str]) -> list[tuple[str, str]]:
    """Find in-page href/src that resolve to missing local files or routes."""
    broken: list[tuple[str, str]] = []
    if not DIST_DIR.is_dir():
        return broken
    skip_dirs = {"posts-legacy", "_astro"}
    for html in DIST_DIR.rglob("*.html"):
        if any(part in skip_dirs for part in html.parts):
            continue
        rel = html.relative_to(DIST_DIR).as_posix()
        text = html.read_text(encoding="utf-8", errors="ignore")
        for href in HREF_RE.findall(text):
            raw = href.strip()
            if not raw or raw.startswith("#") or raw.startswith("?"):
                continue
            if raw.startswith("//") or raw.startswith(SKIP_HREF_PREFIXES):
                continue
            path = raw.split("#")[0].split("?")[0]
            if not path:
                continue
            if not path.startswith("/"):
                broken.append((href, rel))
                continue
            if dist_has(path) or (DIST_DIR / path.lstrip("/")).is_file():
                continue
            if path.endswith(".html") and dist_has(path[: -len(".html")] + "/"):
                continue
            if normalize_url(path) in configured:
                continue
            broken.append((href, rel))
    return broken


def dist_has(url_path: str) -> bool:
    relative = url_path.lstrip("/")
    if relative.endswith(".xml") or relative.endswith(".txt"):
        return (DIST_DIR / relative).is_file()
    return (DIST_DIR / relative / "index.html").is_file()


def normalize_url(path: str) -> str:
    path = path.strip()
    if path.endswith((".xml", ".txt")):
        return path if path.startswith("/") else "/" + path
    return path.rstrip("/") + "/" if path.startswith("/") else "/" + path.rstrip("/") + "/"


def configured_redirects() -> tuple[dict[str, str], list[str]]:
    found: dict[str, str] = {}
    conflicts: list[str] = []

    def add(src: str, dest: str, origin: str) -> None:
        src_n = normalize_url(src)
        dest_n = normalize_url(dest)
        prev = found.get(src_n)
        if prev and prev != dest_n:
            conflicts.append(f"{src_n}: {prev} vs {dest_n} ({origin})")
        found[src_n] = dest_n

    vercel = ROOT / "vercel.json"
    if vercel.exists():
        data = json.loads(vercel.read_text(encoding="utf-8"))
        for item in data.get("redirects", []):
            add(str(item.get("source", "")), str(item.get("destination", "")), "vercel.json")
    astro = (ROOT / "astro.config.mjs").read_text(encoding="utf-8")
    for src, dest in re.findall(r"'(/[^']+)'\s*:\s*'(/[^']+)'", astro):
        add(src, dest, "astro.config.mjs")
    return found, conflicts


def redirect_matches(configured: dict[str, str], src: str, dest: str) -> str | None:
    """Return an error string if the live redirect does not match the fixture."""
    src_n = normalize_url(src)
    dest_n = normalize_url(dest)
    actual = configured.get(src_n)
    if actual is None:
        return f"redirect not configured: {src_n} -> {dest_n}"
    if actual != dest_n:
        return f"redirect target mismatch: {src_n} configured as {actual}, fixture expects {dest_n}"
    return None


def main() -> int:
    if not POSTS_DIR.is_dir():
        print(f"FAIL: posts directory missing: {POSTS_DIR}", file=sys.stderr)
        return 1

    files = sorted(POSTS_DIR.glob("*.md"))
    if len(files) == 0:
        print("FAIL: found 0 posts. Refusing to pass on an empty content tree.", file=sys.stderr)
        return 1
    if len(files) < MIGRATION_BASELINE:
        print(
            f"FAIL: expected at least the {MIGRATION_BASELINE}-post migration baseline, got {len(files)}",
            file=sys.stderr,
        )
        return 1

    bad: list[str] = []
    computed: set[str] = set()
    for f in files:
        fm = parse_frontmatter(f.read_text(encoding="utf-8"))
        if not fm:
            print(f"FAIL {f.name}: no frontmatter")
            bad.append(f.name)
            continue
        if not fm.get("categories"):
            print(f"FAIL {f.name}: missing categories")
            bad.append(f.name)
        url = post_url(f.stem, fm)
        if "<BAD-DATE:" in url:
            print(f"FAIL {f.name}: could not compute URL")
            bad.append(f.name)
        if url in computed:
            print(f"FAIL {f.name}: duplicate URL {url}")
            bad.append(f.name)
        computed.add(url)

    pages, redirects, feeds = load_fixtures()
    if len(pages) < MIGRATION_BASELINE:
        print(f"FAIL: published-urls.txt has {len(pages)} pages, need at least {MIGRATION_BASELINE}")
        bad.append("fixtures")

    computed_abs = {"/" + url.lstrip("/") for url in computed}
    for page in pages:
        if page not in computed_abs:
            print(f"FAIL fixture page missing from current posts: {page}")
            bad.append(page)

    configured, conflicts = configured_redirects()
    for conflict in conflicts:
        print(f"FAIL redirect conflict {conflict}")
        bad.append(conflict)
    for src, dest in redirects.items():
        mismatch = redirect_matches(configured, src, dest)
        if mismatch:
            print(f"FAIL {mismatch}")
            bad.append(src)
            continue
        dest_norm = normalize_url(dest)
        if dest_norm not in computed_abs and not dest_norm.endswith(".xml"):
            print(f"FAIL redirect target missing: {src} -> {dest}")
            bad.append(src)

    dist_ready = DIST_DIR.is_dir()
    if dist_ready:
        for url in sorted(computed):
            if not dist_has(url):
                print(f"FAIL dist missing {url}")
                bad.append(url)
        for feed in feeds:
            if not dist_has(feed):
                print(f"FAIL dist missing {feed}")
                bad.append(feed)
        for href, where in iter_broken_internal_links(configured):
            print(f"FAIL in-page link {href} in {where}")
            bad.append(href)

    print(f"Posts dir: {POSTS_DIR}")
    print(f"Total posts: {len(files)}")
    print(f"Unique URLs: {len(computed)}")
    print(f"Frozen pages: {len(pages)}")
    print(f"Redirects: {len(redirects)}")
    print(f"Dist check: {'yes' if dist_ready else 'skipped'}")
    print(f"Failed: {len(bad)}")
    if "--write-fixtures" in sys.argv:
        lines = ["# Frozen public URLs from the 61-post migration. New posts may be added; old ones must remain.", ""]
        for url in sorted(computed):
            lines.append(f"PAGE /{url}")
        lines.append("FEED /feed.xml")
        lines.append("FEED /posts.xml")
        lines.append("REDIRECT /life/2024/04/02/024-okr/ -> /life/2024/04/02/2024-okr/")
        FIXTURE_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"Wrote {FIXTURE_FILE}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
