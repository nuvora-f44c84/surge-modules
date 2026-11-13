#!/usr/bin/env python3
"""Verification tests for rules/AI.list, rules/X.list, and scripts/sync_ai_rules.py."""

import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
AI_LIST_PATH = ROOT / "rules" / "AI.list"
AI_SUPP_PATH = ROOT / "rules" / "AI-Supplement.list"
X_LIST_PATH = ROOT / "rules" / "X.list"
SYNC_SCRIPT = ROOT / "scripts" / "sync_ai_rules.py"


def active_rules(path: pathlib.Path) -> list[str]:
    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


class AIListTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ai_rules = active_rules(AI_LIST_PATH)
        cls.supp_rules = active_rules(AI_SUPP_PATH)
        cls.x_rules = active_rules(X_LIST_PATH)

        cls.suffixes = set()
        cls.exact_set = set()
        for r in cls.ai_rules:
            rtype, rval = r.split(",", 1)
            cls.exact_set.add(f"{rtype},{rval.lower()}" if rtype != "URL-REGEX" else r)
            if rtype == "DOMAIN-SUFFIX":
                cls.suffixes.add(rval.lower())

    def assertRuleCovered(self, rule: str):
        rtype, rval = rule.split(",", 1)
        key = f"{rtype},{rval.lower()}" if rtype != "URL-REGEX" else rule
        if key in self.exact_set:
            return
        if rtype in ("DOMAIN", "DOMAIN-SUFFIX"):
            parts = rval.lower().split(".")
            for i in range(len(parts)):
                if ".".join(parts[i:]) in self.suffixes:
                    return
        self.fail(f"Expected rule to be covered by AI.list: {rule}")

    def test_no_duplicates_and_valid_ruleset_syntax(self):
        self.assertGreaterEqual(len(self.ai_rules), 250)
        self.assertEqual(len(self.ai_rules), len(set(self.ai_rules)))
        for r in self.ai_rules:
            rtype, rval = r.split(",", 1)
            self.assertIn(
                rtype,
                {"DOMAIN", "DOMAIN-SUFFIX", "DOMAIN-KEYWORD", "DOMAIN-WILDCARD", "URL-REGEX"},
            )
            if rtype != "URL-REGEX":
                self.assertNotIn(",", rval, f"Unexpected policy column in ruleset line: {r}")

    def test_covers_all_ai_supplement_grok_muse_and_apple_intelligence(self):
        for r in self.supp_rules:
            self.assertRuleCovered(r)

        must_cover = [
            # Apple Intelligence PCC & Geo
            "DOMAIN,gspe1-ssl.ls.apple.com",
            "DOMAIN-SUFFIX,issuer.apple.com",
            "DOMAIN-SUFFIX,ropes.apple.com",
            "DOMAIN,mask-api.icloud.com",
            "DOMAIN,mask.icloud.com",
            "DOMAIN,mask-h2.icloud.com",
            "DOMAIN-SUFFIX,app.apple.com",
            "DOMAIN,ss-cleanup-proxy-prod.us-east-1m.app.apple.com",
            "DOMAIN-SUFFIX,apple-relay.apple.com",
            "DOMAIN-SUFFIX,apple-relay.cloudflare.com",
            "DOMAIN-SUFFIX,apple-relay.fastly-edge.com",
            "DOMAIN-SUFFIX,apple-relay.akamaized.net",
            "DOMAIN-SUFFIX,cp4.cloudflare.com",
            "DOMAIN,lens.google.com",
            # OpenAI / Claude / Gemini / Antigravity / Grok / Muse
            "DOMAIN-SUFFIX,openai.com",
            "DOMAIN-SUFFIX,chatgpt.com",
            "DOMAIN-SUFFIX,openai.sufy.com",
            "DOMAIN-SUFFIX,anthropic.com",
            "DOMAIN-SUFFIX,claude.ai",
            "DOMAIN-SUFFIX,gemini.google.com",
            "DOMAIN-SUFFIX,antigravity.google",
            "DOMAIN,antigravity-pa.googleapis.com",
            "DOMAIN-SUFFIX,grok.com",
            "DOMAIN-SUFFIX,x.ai",
            "DOMAIN-SUFFIX,grok.x.com",
            "DOMAIN-SUFFIX,grokusercontent.com",
            "DOMAIN-SUFFIX,muse.ai",
            "DOMAIN-SUFFIX,museai.com",
            "DOMAIN-SUFFIX,ecto1.ai",
            "DOMAIN,meta-ohttp-relay-prod.fastly-edge.com",
        ]
        for r in must_cover:
            self.assertRuleCovered(r)

    def test_strictly_excludes_github_api_and_mandarin_siri_domains(self):
        forbidden_substrings = (
            "api.github.com",
            "7h15.ru1353t.1s.m4d3.by.5ukk4w.skk.moe",
            "guzzoni.apple.com",
            "siri.apple.com",
            "dejavu.apple.com",
            "sequoia.apple.com",
            "smoot.apple.com",
            "smoot.apple.cn",
        )
        joined = "\n".join(self.ai_rules).lower()
        for bad in forbidden_substrings:
            self.assertNotIn(bad, joined, f"Forbidden domain leaked into AI.list: {bad}")

    def test_offline_check_matches_generated_file(self):
        proc = subprocess.run(
            ["python3", str(SYNC_SCRIPT), "--offline", "--check"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)

    def test_x_list_valid(self):
        self.assertEqual(len(self.x_rules), 12)
        self.assertIn("DOMAIN-SUFFIX,x.com", self.x_rules)
        self.assertIn("DOMAIN-SUFFIX,twitter.com", self.x_rules)


if __name__ == "__main__":
    unittest.main()
