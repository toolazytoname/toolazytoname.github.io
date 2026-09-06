#!/usr/bin/env python3
"""Unit checks for URL verification helpers."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("verify_urls", ROOT / "verify-urls.py")
if spec is None or spec.loader is None:
    raise SystemExit("cannot load verify-urls.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def check(cond: bool, msg: str) -> None:
    if not cond:
        raise AssertionError(msg)


def main() -> int:
    fm = mod.parse_frontmatter(
        "---\n"
        "title: t\n"
        "date: 2026-09-06T12:00:00+08:00\n"
        "categories: [life, craft] # category notes\n"
        "---\nbody\n"
    )
    check(fm["categories"] == ["life", "craft"], f"commented array parsed as {fm.get('categories')!r}")
    check(
        mod.post_url("2026-09-06-test", fm) == "life/2026/09/06/test/",
        f"unexpected url {mod.post_url('2026-09-06-test', fm)!r}",
    )

    quoted = mod.parse_scalar('"keep # hash"')
    check(quoted == "keep # hash", f"quoted hash stripped: {quoted!r}")

    mismatch = mod.redirect_matches(
        {"/life/2024/04/02/024-okr/": "/"},
        "/life/2024/04/02/024-okr/",
        "/life/2024/04/02/2024-okr/",
    )
    check(mismatch is not None and "mismatch" in mismatch, f"homepage hijack not caught: {mismatch!r}")

    ok = mod.redirect_matches(
        {"/life/2024/04/02/024-okr/": "/life/2024/04/02/2024-okr/"},
        "/life/2024/04/02/024-okr/",
        "/life/2024/04/02/2024-okr/",
    )
    check(ok is None, f"correct redirect failed: {ok!r}")

    print("verify-urls helpers: ok")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as err:
        print(f"FAIL {err}", file=sys.stderr)
        raise SystemExit(1)
