"""Prove the release gate catches broken output (without third-party packages)."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('verify_site', Path(__file__).with_name('verify-site.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def html(content='', canonical='https://www.weichao.ren/', robots='index,follow'):
    return f'''<!doctype html><html lang="zh-CN"><head><title>Test</title>
<meta http-equiv="content-security-policy" content="script-src 'self'; script-src-attr 'none'">
<meta name="description" content="Description"><meta name="robots" content="{robots}">
<link rel="canonical" href="{canonical}"><script type="application/ld+json">{{"@type":"WebSite"}}</script>
</head><body><main id="main"><h1>Test</h1>{content}</main></body></html>'''


class VerifySiteTests(unittest.TestCase):
    def check_page(self, content):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'index.html').write_text(content)
            return mod.verify(root)[0]

    def test_valid_local_anchor(self):
        self.assertEqual(self.check_page(html('<a href="#main">Go</a>')), [])

    def test_missing_file(self):
        self.assertTrue(any('missing local target' in e for e in self.check_page(html('<img src="/missing.png" alt="">'))))

    def test_missing_anchor(self):
        self.assertTrue(any('missing anchor' in e for e in self.check_page(html('<a href="#missing">Go</a>'))))

    def test_remote_link_not_treated_as_local(self):
        self.assertEqual(self.check_page(html('<a href="https://example.com/">External</a>')), [])

    def test_landmark_and_alt(self):
        errors = self.check_page(html('<h1>Extra</h1><img src="https://example.com/test.png">'))
        self.assertTrue(any('expected 1 h1' in e for e in errors))
        self.assertTrue(any('alt' in e for e in errors))

    def test_invalid_structured_data(self):
        errors = self.check_page(html().replace('{"@type":"WebSite"}', '{broken}'))
        self.assertTrue(any('invalid JSON-LD' in e for e in errors))

    def test_no_build_is_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            self.assertTrue(mod.verify(Path(directory))[0])

    def test_canonical_drift(self):
        self.assertTrue(any('canonical differs' in e for e in self.check_page(html(canonical='https://www.weichao.ren/wrong/'))))

    def test_404_requires_noindex(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / '404.html').write_text(html(canonical='https://www.weichao.ren/404.html'))
            self.assertTrue(any('404 must be noindex' in e for e in mod.verify(root)[0]))

    def test_mixed_content_and_unnamed_embeds(self):
        errors = self.check_page(html('<iframe src="http://example.com/"></iframe>'))
        self.assertTrue(any('mixed-content' in e for e in errors))
        self.assertTrue(any('iframe missing title' in e for e in errors))

    def test_legacy_exception_still_checks_broken_references(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            legacy = root / 'posts-legacy/xmr.html'
            legacy.parent.mkdir()
            legacy.write_text('<a href="/missing/">Old link</a>')
            errors = mod.verify(root)[0]
            self.assertTrue(any('missing local target' in e for e in errors))
            self.assertFalse(any('expected 1 h1' in e for e in errors))

    def test_missing_script_hash(self):
        self.assertTrue(any('missing CSP hash' in e for e in self.check_page(html('<script>window.test=1</script>'))))

    def test_unsafe_event_handler(self):
        self.assertTrue(any('inline event handler' in e for e in self.check_page(html('<button onclick="alert(1)">No</button>'))))

    def test_permissive_csp(self):
        self.assertTrue(any('permissive script CSP' in e for e in self.check_page(html().replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"))))

    def test_srcset_variants_must_exist(self):
        self.assertTrue(any('missing local target' in e for e in self.check_page(html('<img src="https://example.com/a.png" alt="" srcset="/missing-360.webp 360w, /missing-640.webp 640w">'))))
