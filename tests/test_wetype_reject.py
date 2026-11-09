"""Check the WeType reject rule set: format, coverage, and collateral-damage guards."""
from pathlib import Path

text = (Path(__file__).resolve().parent.parent /
        "rules/WeType-Reject.list").read_text(encoding="utf-8")

rules = [line.strip() for line in text.splitlines()
         if line.strip() and not line.strip().startswith("#")]

expected_rules = [
    "DOMAIN-SUFFIX,wetype.weixin.qq.com",
    "DOMAIN-SUFFIX,wetype.wxqcloud.qq.com",
    "DOMAIN-SUFFIX,z.weixin.qq.com",
    "DOMAIN-SUFFIX,ime.weixin.qq.com",
    "DOMAIN-KEYWORD,wetype",
    "DOMAIN-KEYWORD,wxime",
    "DOMAIN-SUFFIX,beacon.qq.com",
    "DOMAIN-SUFFIX,bugly.qq.com",
    "DOMAIN-SUFFIX,trace.qq.com",
]
assert rules == expected_rules, rules

# RULE-SET entries must carry only type and value (no policy or option fields).
for rule in rules:
    assert rule.count(",") == 1, rule
    rtype, rval = rule.split(",", 1)
    assert rtype in ("DOMAIN", "DOMAIN-SUFFIX", "DOMAIN-KEYWORD"), rule
    assert rval and " " not in rval, rule

assert len(set(rules)) == len(rules)


def matches(hostname: str) -> bool:
    host = hostname.lower().rstrip(".")
    for rule in rules:
        rtype, rval = rule.split(",", 1)
        rval = rval.lower()
        if rtype == "DOMAIN" and host == rval:
            return True
        if rtype == "DOMAIN-SUFFIX" and (host == rval or host.endswith("." + rval)):
            return True
        if rtype == "DOMAIN-KEYWORD" and rval in host:
            return True
    return False


# Expected WeType & telemetry targets must match.
for blocked_host in (
    "wetype.weixin.qq.com",
    "h5.wetype.weixin.qq.com",
    "wetype.wxqcloud.qq.com",
    "z.weixin.qq.com",
    "download.z.weixin.qq.com",
    "ime.weixin.qq.com",
    "cdn.wxime.qq.com",
    "otheve.beacon.qq.com",
    "ios.bugly.qq.com",
    "h.trace.qq.com",
):
    assert matches(blocked_host), f"Expected {blocked_host} to match"

# Core WeChat, Apple NTP, general cloud CDNs, and game anti-cheat must NOT match.
for safe_host in (
    "weixin.qq.com",
    "short.weixin.qq.com",
    "long.weixin.qq.com",
    "mp.weixin.qq.com",
    "servicewechat.com",
    "qq.com",
    "myqcloud.com",
    "time.apple.com",
    "nytimes.com",
    "tpstelemetry.tencent.com",
):
    assert not matches(safe_host), f"Must not block safe host: {safe_host}"

print(f"PASS: WeType reject rule set, {len(rules)} rules verified, WeChat & system hosts unaffected")
