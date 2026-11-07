"""Check the Zhibo8 module is a rule-only module with the complete 0.2.0 rule list."""
from pathlib import Path

module_text = (Path(__file__).resolve().parent.parent /
               "modules/Zhibo8-AdBlock-Lite.sgmodule").read_text(encoding="utf-8")

metadata = {}
sections = {}
section = None
for raw_line in module_text.splitlines():
    line = raw_line.strip()
    if not line:
        continue
    if line.startswith("#!"):
        key, value = line[2:].split("=", 1)
        metadata[key.strip()] = value.strip()
        continue
    if line.startswith("#"):
        continue
    if line.startswith("[") and line.endswith("]"):
        section = line
        sections[section] = []
    else:
        assert section is not None, f"Line outside section: {line}"
        sections[section].append(line)

assert metadata["version"] == "0.2.0"
assert metadata["name"] == "直播吧 · 广告域名补充"
assert metadata["category"] == "去广告"

# Rule-only: no MITM, rewrite, map local, body rewrite or script sections.
assert set(sections) == {"[Rule]"}, set(sections)

assert sections["[Rule]"] == [
    "DOMAIN-SUFFIX,ggck.qiumibao.com,REJECT,extended-matching",
    "DOMAIN-SUFFIX,bifen3.qiumibao.com,REJECT,extended-matching",
    "DOMAIN-SUFFIX,tongji.qiumibao.com,REJECT,extended-matching",
    "DOMAIN-SUFFIX,apimg.dongdianqiu.com,REJECT,extended-matching",
    "IP-CIDR,47.99.237.245/32,REJECT,no-resolve",
    "IP-CIDR,118.178.168.156/32,REJECT,no-resolve",
    "IP-CIDR,203.119.204.80/32,REJECT,no-resolve",
    "IP-CIDR,118.178.122.133/32,REJECT,no-resolve",
    "IP-CIDR,47.114.58.47/32,REJECT,no-resolve",
    "IP-CIDR,47.110.246.204/32,REJECT,no-resolve",
    "IP-CIDR,47.111.8.123/32,REJECT,no-resolve",
    "DOMAIN-SUFFIX,mssdk.volces.com,REJECT,extended-matching",
    "DOMAIN-SUFFIX,tanx.com,REJECT,extended-matching",
]

# Every domain rule must also match SNI / Host; IP rules must not carry it.
for rule in sections["[Rule]"]:
    if rule.startswith(("DOMAIN", "DOMAIN-SUFFIX")):
        assert rule.endswith(",extended-matching"), rule
    else:
        assert "extended-matching" not in rule, rule

# JD general image CDN must stay unblocked.
assert not any("img1.360buyimg.com" in rule for rule in sections["[Rule]"])
# No whole-domain block on the Zhibo8 root domain.
assert not any(rule.startswith(("DOMAIN-SUFFIX,qiumibao.com", "DOMAIN,qiumibao.com"))
               for rule in sections["[Rule]"])
# IP rules must not trigger DNS resolution.
for rule in sections["[Rule]"]:
    if rule.startswith("IP-CIDR"):
        assert rule.endswith(",no-resolve"), rule

print("PASS: Zhibo8 0.2.0 rule-only module, 6 domains + 7 IPs verified, no-resolve & extended-matching intact")
