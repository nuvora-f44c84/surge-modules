"""Check the Alibaba direct rule set: exact suffix list, rule-set format, no policy field."""
from pathlib import Path

text = (Path(__file__).resolve().parent.parent /
        "rules/Alibaba-Direct.list").read_text(encoding="utf-8")

rules = [line.strip() for line in text.splitlines()
         if line.strip() and not line.strip().startswith("#")]

expected_suffixes = [
    "taobao.com", "tmall.com", "tb.cn", "etao.com",
    "alicdn.com", "alicdn.net", "tbcache.com", "alibabausercontent.com",
    "aliapp.com", "aliapp.org",
    "cainiao.com",
    "alipay.com", "alipayobjects.com",
]
assert rules == [f"DOMAIN-SUFFIX,{s}" for s in expected_suffixes], rules

# RULE-SET entries must not carry a policy (the policy comes from the RULE-SET line).
for rule in rules:
    assert rule.count(",") == 1, rule

# No duplicates, no IP / ASN / process / generic Alibaba Cloud rules.
assert len(set(rules)) == len(rules)
for rule in rules:
    assert not rule.startswith(("IP-CIDR", "IP-ASN", "PROCESS-NAME", "GEOIP")), rule
for generic in ("aliyun.com", "aliyuncs.com"):
    assert f"DOMAIN-SUFFIX,{generic}" not in rules, generic

print(f"PASS: Alibaba direct rule set, {len(rules)} DOMAIN-SUFFIX entries, no policy field, no generic cloud domains")
