#!/usr/bin/env python3
"""Migrate Jekyll _posts/ → Astro src/content/posts/.

Source: /Users/lazy/Code/crack/sell/notes/migration-source-2026-07-12/_posts/*.markdown
Target: /Users/lazy/Code/crack/toolazytoname.github.io/src/content/posts/*.md

Operations:
1. Parse frontmatter (YAML-ish, hand-rolled — Jekyll supports lots of YAML
   but these 61 posts all use a flat subset).
2. Strip Jekyll-specific fields: `layout: post` and `catalog: true`.
3. Normalize date `2019-9-19 17:24:32 +0800` → `2019-09-19T17:24:32+08:00`
   so Astro's `z.coerce.date()` parses without surprises.
4. Rewrite body references: `{{ site.url }}/assets/X` → `/posts-legacy/X`.
5. Preserve filename including `YYYY-MM-DD-` prefix → Astro id remains the
   same, which keeps the permalink function `postSlug(id, data)` happy.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SOURCE = Path("/Users/lazy/Code/crack/sell/notes/migration-source-2026-07-12/_posts")
TARGET = Path("/Users/lazy/Code/crack/toolazytoname.github.io/src/content/posts")

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n(.*)", re.DOTALL)
KV_RE = re.compile(r"^(\s*)([\w-]+):\s*(.*)$")
LIST_ITEM_RE = re.compile(r"^\s*-\s*(.*)$")


def parse_frontmatter(raw: str) -> tuple[dict, str]:
    m = FRONTMATTER_RE.match(raw)
    if not m:
        return {}, raw
    body = m.group(2)
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
    return fm, body


def normalize_date(s: str) -> str:
    s = s.strip()
    m = re.match(
        r"(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})(?:\s*([+-]\d{4}))?",
        s,
    )
    if not m:
        return s
    y, mo, d, h, mi, sec, tz = m.groups()
    tz = tz or "+0800"
    if len(tz) == 5:
        tz = tz[:3] + ":" + tz[3:]
    return f"{y}-{int(mo):02d}-{int(d):02d}T{int(h):02d}:{mi}:{sec}{tz}"


def rewrite_body(body: str) -> str:
    # 1. Asset references: {{ site.url }}/assets/X → /posts-legacy/X
    body = re.sub(
        r"\{\{\s*site\.url\s*\}\}/assets/([^)\s]+)",
        r"/posts-legacy/\1",
        body,
    )
    # 2. Any remaining `{{ site.url }}` (cross-post links etc.) → strip prefix.
    # The trailing path is already an absolute URL Astro will serve from root
    # because our permalink function emits it as the slug.
    body = re.sub(r"\{\{\s*site\.url\s*\}\}", "", body)
    return body


def yaml_quote(s: str) -> str:
    """Quote a string for safe YAML output.

    Bare strings fail when they start with reserved indicators (@, &, *, !, |, >, %, `, ?, -, :, [, ], {, }, ,, #, &, !, |, >, ', ", %, @, `) or contain
    newlines. Default to double quotes with backslash escapes.
    """
    if not isinstance(s, str):
        return str(s)
    if re.match(r"^[&*!|>%@`'\",:?{}\[\]#-]", s) or "\n" in s:
        escaped = s.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return s


def render_frontmatter(fm: dict) -> str:
    lines = ["---"]
    for k, v in fm.items():
        if isinstance(v, list):
            lines.append(f"{k}:")
            for item in v:
                lines.append(f"  - {yaml_quote(item)}")
        else:
            lines.append(f"{k}: {yaml_quote(v)}")
    lines.append("---")
    return "\n".join(lines)


def main() -> int:
    if not SOURCE.exists():
        print(f"ERROR: source dir not found: {SOURCE}", file=sys.stderr)
        return 1
    TARGET.mkdir(parents=True, exist_ok=True)
    files = sorted(SOURCE.glob("*.markdown"))
    written = 0
    skipped = 0
    for f in files:
        text = f.read_text(encoding="utf-8")
        fm, body = parse_frontmatter(text)
        if not fm:
            print(f"WARN: no frontmatter in {f.name}", file=sys.stderr)
            skipped += 1
            continue
        fm.pop("layout", None)
        fm.pop("catalog", None)
        if "date" in fm:
            fm["date"] = normalize_date(fm["date"])
        body = rewrite_body(body)
        out = render_frontmatter(fm) + "\n" + body
        (TARGET / (f.stem + ".md")).write_text(out, encoding="utf-8")
        written += 1
    print(f"OK: wrote {written}, skipped {skipped}, target = {TARGET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())