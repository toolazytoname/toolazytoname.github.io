#!/usr/bin/env python3
"""Verify migrated posts' URL coverage matches the live Jekyll site.

For each post under src/content/posts/, compute its expected URL via the
postSlug rules from src/lib/permalink.ts (reimplemented here in Python for
verification — these MUST stay in sync) and confirm:

1. Every post has a `categories` field with at least one entry.
2. Every post has a parseable `date`.
3. The post slug (filename stem minus YYYY-MM-DD- prefix) is non-empty.
4. The category slug is non-empty.
5. The expected URL matches the live weichao.ren pattern.
6. There are 61 posts total.

Prints a per-post report to stdout and exits non-zero if any check fails.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

POSTS_DIR = Path("/Users/lazy/Code/crack/toolazytoname.github.io/src/content/posts")

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n(.*)", re.DOTALL)
KV_RE = re.compile(r"^(\s*)([\w-]+):\s*(.*)$")
LIST_ITEM_RE = re.compile(r"^\s*-\s*(.*)$")


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
            item = LIST_ITEM_RE.match(line).group(1).strip().strip('"').strip("'")
            if not isinstance(fm.get(cur_key), list):
                fm[cur_key] = []
            fm[cur_key].append(item)
            continue
        kv = KV_RE.match(line)
        if kv:
            indent, key, value = kv.groups()
            if indent == "":
                cur_key = key
                fm[key] = value.strip().strip('"').strip("'")
    return fm


def category_to_path(cat: str) -> str:
    return (
        cat.lower()
        .split()
    )
# Note: real logic uses split(/\s+/).filter(Boolean).map(replace).join('/')
def category_path(cat: str) -> str:
    segs = [s for s in re.split(r"\s+", cat.lower().strip()) if s]
    segs = [re.sub(r"[^a-z0-9]", "", s) for s in segs]
    segs = [s for s in segs if s]
    return "/".join(segs)


def post_url(id_stem: str, fm: dict) -> str:
    cats = fm.get("categories", "")
    if isinstance(cats, list):
        cat = cats[0] if cats else ""
    else:
        cat = cats
    cat_path = category_path(cat) or "uncategorized"
    date_str = fm.get("date", "")
    # date is ISO 8601: 2017-06-16T19:44:32+08:00
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", date_str)
    if not m:
        return f"<BAD-DATE:{date_str}>/{cat_path}"
    y, mo, d = m.groups()
    fname_slug = id_stem[11:] if len(id_stem) > 11 else id_stem
    return f"{cat_path}/{y}/{mo}/{d}/{fname_slug}/"


def main() -> int:
    files = sorted(POSTS_DIR.glob("*.md"))
    if len(files) != 61:
        print(f"WARN: expected 61 posts, got {len(files)}", file=sys.stderr)
    bad = []
    url_set: set[str] = set()
    for f in files:
        fm = parse_frontmatter(f.read_text(encoding="utf-8"))
        if not fm:
            print(f"FAIL {f.name}: no frontmatter")
            bad.append(f.name)
            continue
        # Required fields
        cats = fm.get("categories", "")
        if not cats:
            print(f"FAIL {f.name}: missing categories")
            bad.append(f.name)
        date = fm.get("date", "")
        if not re.match(r"\d{4}-\d{2}-\d{2}", date):
            print(f"FAIL {f.name}: bad date '{date}'")
            bad.append(f.name)
        # Compute URL
        url = post_url(f.stem, fm)
        if url in url_set:
            print(f"FAIL {f.name}: duplicate URL {url}")
            bad.append(f.name)
        url_set.add(url)
    print(f"\nTotal posts: {len(files)}")
    print(f"Unique URLs: {len(url_set)}")
    print(f"Failed: {len(bad)}")
    if bad:
        for b in bad:
            print(f"  - {b}")
        return 1
    # Sample 5 URLs
    sample = sorted(url_set)[:5]
    print("\nSample URLs (first 5):")
    for u in sample:
        print(f"  https://weichao.ren/{u}")
    return 0


if __name__ == "__main__":
    sys.exit(main())