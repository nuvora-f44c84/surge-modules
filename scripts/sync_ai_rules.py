#!/usr/bin/env python3
"""
Build and sync `rules/AI.list` from curated sections (`src/ai_base_sections.json`)
plus daily upstream checks against Sukka's `ai.conf` and `apple_intelligence.conf`.

Safety invariants enforced automatically:
- Never include generic `api.github.com` / `github.com` / `githubusercontent.com`.
- Never include Mandarin Siri core domains (`guzzoni.apple.com`, `siri.apple.com`,
  `dejavu.apple.com`, `sequoia.apple.com`, `smoot.apple.com`, `smoot.apple.cn`).
- Never include Sukka watermark domains or bare shared cloud/OS root domains.
- Deduplicate exact rules and skip `DOMAIN,foo` when `DOMAIN-SUFFIX,foo` (or a parent
  suffix in `AI.list`) already covers it.
"""

import argparse
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE_SECTIONS_PATH = ROOT / "src" / "ai_base_sections.json"
UPSTREAM_CACHE_PATH = ROOT / "src" / "ai_upstream_cache.json"
OUTPUT_LIST_PATH = ROOT / "rules" / "AI.list"

UPSTREAM_URLS = [
    "https://ruleset.skk.moe/List/non_ip/ai.conf",
    "https://ruleset.skk.moe/List/non_ip/apple_intelligence.conf",
]

ALLOWED_TYPES = {
    "DOMAIN",
    "DOMAIN-SUFFIX",
    "DOMAIN-KEYWORD",
    "DOMAIN-WILDCARD",
    "URL-REGEX",
}

FORBIDDEN_EXACT_VALUES = {
    "7h15.ru1353t.1s.m4d3.by.5ukk4w.skk.moe",
    "api.github.com",
    "github.com",
    "githubusercontent.com",
    "guzzoni.apple.com",
    "siri.apple.com",
    "dejavu.apple.com",
    "sequoia.apple.com",
    "smoot.apple.com",
    "smoot.apple.cn",
    "apple.com",
    "icloud.com",
    "google.com",
    "googleapis.com",
    "gstatic.com",
    "microsoft.com",
    "amazonaws.com",
    "cloudflare.com",
    "fastly-edge.com",
    "akamaized.net",
}

FORBIDDEN_SUFFIXES = (
    "guzzoni.apple.com",
    "siri.apple.com",
    "smoot.apple.com",
    "smoot.apple.cn",
)


def fetch_text(url: str) -> str:
    proc = subprocess.run(
        [
            "curl",
            "-fsSL",
            "--retry",
            "4",
            "--retry-all-errors",
            "--retry-delay",
            "2",
            "-H",
            "User-Agent: surge-modules-ai-sync/1.0",
            url,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return proc.stdout


def is_safe_rule(rtype: str, rval: str) -> bool:
    if rtype not in ALLOWED_TYPES:
        return False
    if not rval or any(ch in rval for ch in ("\r", "\n", " ")):
        return False
    if rtype == "URL-REGEX":
        return True
    lower = rval.lower().strip(".")
    if lower in FORBIDDEN_EXACT_VALUES:
        return False
    for bad in FORBIDDEN_SUFFIXES:
        if lower == bad or lower.endswith("." + bad):
            return False
    return True


def is_covered_by_suffix(domain: str, suffixes: set[str]) -> bool:
    d = domain.lower().strip(".")
    if d in suffixes:
        return True
    parts = d.split(".")
    for i in range(1, len(parts)):
        parent = ".".join(parts[i:])
        if parent in suffixes:
            return True
    return False


def parse_rules(text: str) -> list[tuple[str, str]]:
    parsed = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith("//"):
            continue
        if "," not in line:
            continue
        rtype, rest = line.split(",", 1)
        rtype = rtype.strip().upper()
        # Strip inline comments if any
        rval = rest.split(" //", 1)[0].strip()
        if is_safe_rule(rtype, rval):
            parsed.append((rtype, rval))
    return parsed


def build_list(offline: bool = False) -> tuple[str, list[str]]:
    sections = json.loads(BASE_SECTIONS_PATH.read_text(encoding="utf-8"))

    seen_keys: set[str] = set()
    known_suffixes: set[str] = set()

    for sec in sections:
        for rule in sec["rules"]:
            rtype, rval = rule.split(",", 1)
            if rtype == "DOMAIN-SUFFIX":
                known_suffixes.add(rval.lower())

    rendered_sections = []
    for sec in sections:
        clean_lines = []
        for rule in sec["rules"]:
            rtype, rval = rule.split(",", 1)
            if not is_safe_rule(rtype, rval):
                raise RuntimeError(f"Unsafe rule in base sections: {rule}")
            key = f"{rtype},{rval}" if rtype == "URL-REGEX" else f"{rtype},{rval.lower()}"
            if key in seen_keys:
                continue
            seen_keys.add(key)
            clean_lines.append(f"{rtype},{rval}")
        rendered_sections.append((sec["title"], clean_lines))

    upstream_rules: list[str] = []
    if offline:
        if UPSTREAM_CACHE_PATH.exists():
            upstream_rules = json.loads(UPSTREAM_CACHE_PATH.read_text(encoding="utf-8"))
    else:
        fetched_candidates: list[tuple[str, str]] = []
        for url in UPSTREAM_URLS:
            fetched_candidates.extend(parse_rules(fetch_text(url)))

        for rtype, rval in fetched_candidates:
            key = f"{rtype},{rval}" if rtype == "URL-REGEX" else f"{rtype},{rval.lower()}"
            if key in seen_keys:
                continue
            if rtype in ("DOMAIN", "DOMAIN-SUFFIX") and is_covered_by_suffix(
                rval, known_suffixes
            ):
                continue
            seen_keys.add(key)
            if rtype == "DOMAIN-SUFFIX":
                known_suffixes.add(rval.lower())
            upstream_rules.append(f"{rtype},{rval}")

    if upstream_rules:
        rendered_sections.append(
            ("Upstream Auto-Synced (Sukka AI / Apple Intelligence)", upstream_rules)
        )

    header = [
        "# AI 统一分流规则集（AI.list）",
        "# 聚合范围：Apple Intelligence（PCC 与地区资格校验）、OpenAI、Anthropic/Claude、",
        "# Google Gemini/AI Studio/Antigravity/NotebookLM、xAI/Grok、Meta AI/Muse、",
        "# Cursor/Windsurf/Copilot 等 AI 开发工具与主流 AIGC 平台。",
        "# 自动同步：由 GitHub Actions 每日巡检 Sukka ai.conf 与 apple_intelligence.conf，",
        "# 自动剔除 api.github.com 误伤项与中文 Siri 核心直连域名（guzzoni/siri/smoot）。",
        "# 顺序要求：须置于国内 AI 直连（cn.list）之后、X.list 与 Apple_All 之前。",
        "# 说明与许可：../docs/ai-list.md（含 VPSDance MIT 许可声明）",
        "",
    ]

    body = list(header)
    for title, rules in rendered_sections:
        if not rules:
            continue
        body.append(f"# {title}")
        body.extend(rules)
        body.append("")

    content = "\n".join(body).rstrip() + "\n"
    return content, upstream_rules


def main() -> int:
    parser = argparse.ArgumentParser(description="Build and sync rules/AI.list.")
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Use cached upstream rules without network requests.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify rules/AI.list matches generated output without writing.",
    )
    args = parser.parse_args()

    content, upstream_rules = build_list(offline=args.offline)

    if args.check:
        current = OUTPUT_LIST_PATH.read_text(encoding="utf-8") if OUTPUT_LIST_PATH.exists() else ""
        if current != content:
            print("rules/AI.list is out of date.", file=sys.stderr)
            return 1
        print("OK: rules/AI.list is up to date.")
        return 0

    if not args.offline:
        UPSTREAM_CACHE_PATH.write_text(
            json.dumps(upstream_rules, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    OUTPUT_LIST_PATH.write_text(content, encoding="utf-8")
    total_rules = sum(
        1
        for line in content.splitlines()
        if line.strip() and not line.strip().startswith("#")
    )
    print(
        f"Wrote {OUTPUT_LIST_PATH.relative_to(ROOT)} ({total_rules} rules; {len(upstream_rules)} upstream extras)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
