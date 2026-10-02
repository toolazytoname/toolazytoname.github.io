import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('links', Path(__file__).with_name('audit-external-links.py'))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)

class ExternalLinksTests(unittest.TestCase):
    def test_classification_does_not_call_rate_limits_or_auth_dead(self):
        for code in (403, 401, 429, 500, 503): self.assertEqual(mod.classify(code), 'indeterminate')
        for code in (404, 410): self.assertEqual(mod.classify(code), 'broken')
        self.assertEqual(mod.classify(200), 'reachable')

    def test_collects_navigation_and_images_not_metadata(self):
        p = mod.Links(); p.feed('<a href="https://example.com/a#b">x</a><img src="//example.com/a"><a href="/posts/">local</a><link rel="canonical" href="https://custom.test/">')
        self.assertEqual(p.urls, {'https://example.com/a'})

    def test_escapes_unicode_without_double_encoding(self):
        p = mod.Links(); p.feed('<a href="https://example.com/中文/%20">x</a>')
        self.assertEqual(p.urls, {'https://example.com/%E4%B8%AD%E6%96%87/%20'})

    def test_rejects_private_and_mixed_dns_destinations(self):
        for addresses in ([('127.0.0.1', 80)], [('93.184.216.34', 80), ('10.0.0.1', 80)]):
            with patch.object(mod.socket, 'getaddrinfo', return_value=[(0, 0, 0, '', a) for a in addresses]):
                with self.assertRaises(ValueError): mod.public_url('https://example.test/')

    def test_no_credentials_or_non_http_destinations(self):
        for url in ('file:///tmp/a', 'https://user:pass@example.com', 'https://example.com:8080'):
            with self.assertRaises(ValueError): mod.public_url(url)
