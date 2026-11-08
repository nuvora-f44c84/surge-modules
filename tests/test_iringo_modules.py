#!/usr/bin/env python3
"""Verification tests for iRingo Siri/Spotlight and TestFlight modules."""

import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SIRI_MODULE = ROOT / "modules" / "iRingo-Siri-Spotlight.sgmodule"
SIRI_DOC = ROOT / "docs" / "iringo-siri-spotlight.md"
TF_MODULE = ROOT / "modules" / "iRingo-TestFlight.sgmodule"
TF_DOC = ROOT / "docs" / "iringo-testflight.md"


class IRingoModulesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.siri_text = SIRI_MODULE.read_text(encoding="utf-8")
        cls.siri_doc = SIRI_DOC.read_text(encoding="utf-8")
        cls.tf_text = TF_MODULE.read_text(encoding="utf-8")
        cls.tf_doc = TF_DOC.read_text(encoding="utf-8")

    def test_siri_spotlight_module_structure(self):
        self.assertIn("#!name=Siri 与聚焦搜索（iRingo）", self.siri_text)
        self.assertIn("#!category= iRingo", self.siri_text)
        self.assertIn("CountryCode:US,SiriLocale:zh_CN", self.siri_text)
        self.assertIn("SiriResponseLanguageVariant:zh_CN", self.siri_text)
        active_lines = [
            line
            for line in self.siri_text.splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]
        for line in active_lines:
            self.assertNotIn("debug=1", line)
        self.assertIn(
            "https://github.com/NSRingo/Siri/releases/download/v4.2.7/request.bundle.js",
            self.siri_text,
        )
        self.assertIn(
            "https://github.com/NSRingo/Siri/releases/download/v4.2.7/response.bundle.js",
            self.siri_text,
        )
        self.assertIn(
            "hostname = %APPEND% guzzoni.smoot.apple.com, api*.smoot.apple.com, api.smoot.apple.cn",
            self.siri_text,
        )

        # Verify all script patterns compile cleanly
        patterns = re.findall(r"pattern=([^,]+),", self.siri_text)
        self.assertEqual(len(patterns), 11)
        for pat in patterns:
            re.compile(pat)

    def test_testflight_module_structure(self):
        self.assertIn("#!name=TestFlight · 区域与通用应用（iRingo）", self.tf_text)
        self.assertIn("#!category= iRingo", self.tf_text)
        self.assertIn(
            "CountryCode:US,MultiAccount:false,Universal:true",
            self.tf_text,
        )
        self.assertIn("skip-proxy = %APPEND% iosapps.itunes.apple.com", self.tf_text)
        self.assertIn(
            "https://github.com/NSRingo/TestFlight/releases/download/v3.4.0/request.bundle.js",
            self.tf_text,
        )
        self.assertIn(
            "https://github.com/NSRingo/TestFlight/releases/download/v3.4.0/response.bundle.js",
            self.tf_text,
        )
        self.assertIn("hostname = %APPEND% testflight.apple.com", self.tf_text)

    def test_docs_reference_fixed_urls_and_apache_license(self):
        self.assertIn("iRingo-Siri-Spotlight.sgmodule", self.siri_doc)
        self.assertIn("Apache-2.0", self.siri_doc)
        self.assertIn("iRingo-TestFlight.sgmodule", self.tf_doc)
        self.assertIn("Apache-2.0", self.tf_doc)


if __name__ == "__main__":
    unittest.main()
