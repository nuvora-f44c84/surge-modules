#!/usr/bin/env python3
"""Verification tests for all iRingo modules and synced upstream JS bundles."""

import hashlib
import json
import pathlib
import re
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
IRINGO_DIR = ROOT / "scripts" / "iringo"
VERSIONS_PATH = IRINGO_DIR / "versions.json"

WEATHER_MODULE = ROOT / "modules" / "iRingo-WeatherKit-US.sgmodule"
LOC_MODULE = ROOT / "modules" / "iRingo-LocationService-US.sgmodule"
SIRI_MODULE = ROOT / "modules" / "iRingo-Siri-Spotlight.sgmodule"
SIRI_DOC = ROOT / "docs" / "iringo-siri-spotlight.md"
TF_MODULE = ROOT / "modules" / "iRingo-TestFlight.sgmodule"
TF_DOC = ROOT / "docs" / "iringo-testflight.md"


class IRingoModulesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.weather_text = WEATHER_MODULE.read_text(encoding="utf-8")
        cls.loc_text = LOC_MODULE.read_text(encoding="utf-8")
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
            "https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/iringo/Siri-request.bundle.js",
            self.siri_text,
        )
        self.assertIn(
            "https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/iringo/Siri-response.bundle.js",
            self.siri_text,
        )
        self.assertNotIn("github.com/NSRingo/Siri/releases/download", self.siri_text)
        self.assertIn(
            "hostname = %APPEND% guzzoni.smoot.apple.com, api*.smoot.apple.com, api.smoot.apple.cn",
            self.siri_text,
        )

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
            "https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/iringo/TestFlight-request.bundle.js",
            self.tf_text,
        )
        self.assertIn(
            "https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/iringo/TestFlight-response.bundle.js",
            self.tf_text,
        )
        self.assertNotIn(
            "github.com/NSRingo/TestFlight/releases/download", self.tf_text
        )
        self.assertIn("hostname = %APPEND% testflight.apple.com", self.tf_text)

    def test_weather_uses_raw_bundles(self):
        self.assertIn(
            "https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/iringo/WeatherKit-request.bundle.js",
            self.weather_text,
        )
        self.assertIn(
            "https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/iringo/WeatherKit-response.bundle.js",
            self.weather_text,
        )
        self.assertNotIn(
            "github.com/NSRingo/WeatherKit/releases/download", self.weather_text
        )

    def test_synced_bundles_and_versions_manifest(self):
        self.assertTrue(VERSIONS_PATH.exists(), "versions.json missing")
        manifest = json.loads(VERSIONS_PATH.read_text(encoding="utf-8"))
        for key in ("WeatherKit", "Siri", "TestFlight"):
            self.assertIn(key, manifest)
            entry = manifest[key]
            self.assertRegex(entry["tag_name"], r"^v\d+\.\d+\.\d+$")
            for local_name, asset_meta in entry["assets"].items():
                bundle_path = IRINGO_DIR / local_name
                self.assertTrue(bundle_path.exists(), f"Missing {local_name}")
                data = bundle_path.read_bytes()
                self.assertEqual(len(data), asset_meta["size"])
                self.assertEqual(
                    hashlib.sha256(data).hexdigest(), asset_meta["sha256"]
                )
                subprocess.run(
                    ["node", "--check", str(bundle_path)],
                    check=True,
                    capture_output=True,
                )

    def test_docs_reference_fixed_urls_and_apache_license(self):
        self.assertIn("iRingo-Siri-Spotlight.sgmodule", self.siri_doc)
        self.assertIn("Apache-2.0", self.siri_doc)
        self.assertIn("iRingo-TestFlight.sgmodule", self.tf_doc)
        self.assertIn("Apache-2.0", self.tf_doc)


if __name__ == "__main__":
    unittest.main()
