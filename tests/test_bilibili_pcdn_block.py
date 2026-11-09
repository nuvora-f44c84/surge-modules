#!/usr/bin/env python3
"""Verification tests for modules/Bilibili-PCDN-Block.sgmodule."""

import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "modules" / "Bilibili-PCDN-Block.sgmodule"
DOC_PATH = ROOT / "docs" / "bilibili-pcdn-block.md"


class BilibiliPcdnBlockTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module_text = MODULE_PATH.read_text(encoding="utf-8")
        cls.doc_text = DOC_PATH.read_text(encoding="utf-8")
        cls.rule_lines = [
            line.strip()
            for line in cls.module_text.splitlines()
            if line.strip()
            and not line.strip().startswith("#")
            and not line.strip().startswith("[")
        ]

    def test_metadata_and_rule_only_scope(self):
        self.assertIn("#!name=哔哩哔哩 · PCDN 节点屏蔽", self.module_text)
        self.assertIn("#!version=0.1.0", self.module_text)
        self.assertNotIn("[MITM]", self.module_text)
        self.assertNotIn("[Script]", self.module_text)

    def test_all_rules_use_reject_no_drop_and_have_no_duplicates(self):
        self.assertEqual(len(self.rule_lines), 77)
        self.assertEqual(len(self.rule_lines), len(set(self.rule_lines)))
        for line in self.rule_lines:
            parts = line.split(",")
            self.assertEqual(
                len(parts),
                4,
                f"Expected 4 comma-separated fields in rule: {line}",
            )
            self.assertIn(
                parts[0],
                ("DOMAIN-SUFFIX", "DOMAIN-WILDCARD", "DOMAIN-KEYWORD"),
            )
            self.assertEqual(parts[2], "REJECT-NO-DROP")
            self.assertEqual(parts[3], "extended-matching")

    def test_excludes_unrelated_api_domains(self):
        for line in self.rule_lines:
            self.assertNotIn("cm.bilibili.com", line)
            self.assertNotIn("data.bilibili.com", line)
            self.assertNotIn("dataflow.biliapi.com", line)

    def test_doc_explains_reject_no_drop_and_fallback(self):
        self.assertIn("Bilibili-PCDN-Block.sgmodule", self.doc_text)
        self.assertIn("REJECT-NO-DROP", self.doc_text)
        self.assertIn("cm.bilibili.com", self.doc_text)


if __name__ == "__main__":
    unittest.main()
