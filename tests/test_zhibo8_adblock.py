"""Check the Zhibo8 module is a rule-only module with the exact published rule list."""
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

assert metadata["version"] == "0.1.0"
assert metadata["name"] == "直播吧 · 广告域名补充"
assert metadata["category"] == "去广告"

# Rule-only: no MITM, rewrite, map local, body rewrite or script sections.
assert set(sections) == {"[Rule]"}, set(sections)

assert sections["[Rule]"] == [
    "DOMAIN-SUFFIX,ggck.qiumibao.com,REJECT",
    "DOMAIN-SUFFIX,tongji.qiumibao.com,REJECT",
    "IP-CIDR,47.111.8.123/32,REJECT,no-resolve",
    "DOMAIN-SUFFIX,mssdk.volces.com,REJECT",
    "DOMAIN-SUFFIX,tanx.com,REJECT",
]

# Hosts that may carry normal content must stay unblocked.
for host in ("bifen3.qiumibao.com", "img1.360buyimg.com"):
    assert not any(host in rule for rule in sections["[Rule]"]), host
# No whole-domain block on the Zhibo8 root domain.
assert not any(rule.startswith(("DOMAIN-SUFFIX,qiumibao.com", "DOMAIN,qiumibao.com"))
               for rule in sections["[Rule]"])
# IP rules must not trigger DNS resolution.
for rule in sections["[Rule]"]:
    if rule.startswith("IP-CIDR"):
        assert rule.endswith(",no-resolve"), rule

print("PASS: Zhibo8 rule-only module, exact rule list, protected hosts unblocked, IP rules no-resolve")
