"""Check syntax, URL boundaries, JQ filters and MITM scope for WeChat Official Accounts & Mini Programs."""
import json
from pathlib import Path
import re
import shlex
import subprocess

root = Path(__file__).resolve().parent.parent


def parse_module(rel_path):
    text = (root / rel_path).read_text(encoding="utf-8")
    metadata = {}
    sections = {}
    section = None
    for raw_line in text.splitlines():
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
    return text, metadata, sections


def run_jq(expression, payload):
    result = subprocess.run(
        ["jq", "-c", expression],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        check=True,
    )
    assert len(result.stdout.splitlines()) == 1
    return json.loads(result.stdout)


# 1. WeChat Official Accounts module
oa_text, oa_meta, oa_sections = parse_module("modules/WeChat-Official-Accounts-AdBlock-Lite.sgmodule")
assert oa_meta["name"] == "微信公众号 · 广告过滤"
assert oa_meta["version"] == "0.1.0"
assert set(oa_sections) == {"[Rule]", "[Map Local]", "[MITM]"}
assert "[Script]" not in oa_sections
assert oa_sections["[Rule]"] == ["DOMAIN-SUFFIX,wxs.qq.com,REJECT,extended-matching"]
assert oa_sections["[MITM]"] == ["hostname = %APPEND% mp.weixin.qq.com"]

assert len(oa_sections["[Map Local]"]) == 2
ml1_pattern = oa_sections["[Map Local]"][0].split(" ", 1)[0]
ml2_pattern = oa_sections["[Map Local]"][1].split(" ", 1)[0]
re1 = re.compile(ml1_pattern[4:], re.IGNORECASE)
re2 = re.compile(ml2_pattern[4:], re.IGNORECASE)
for endpoint in ("cps_product_info", "getappmsgad", "jsmonitor", "masonryfeed", "relatedarticle"):
    assert re1.search(f"https://mp.weixin.qq.com/mp/{endpoint}?__biz=MzA0")
assert not re1.search("https://mp.weixin.qq.com/mp/getappmsgext?__biz=MzA0")
assert re2.search("https://mp.weixin.qq.com/mp/relatedsearchword?__biz=MzA0")
assert re2.search("https://mp.weixin.qq.com/mp/relatedsearchword")
assert not re2.search("https://mp.weixin.qq.com/mp/relatedsearchword_other")

# 2. WeChat Mini Programs module
mp_text, mp_meta, mp_sections = parse_module("modules/WeChat-MiniPrograms-AdBlock-Lite.sgmodule")
assert mp_meta["name"] == "微信小程序 · 广告过滤（无脚本版）"
assert mp_meta["version"] == "0.1.0"
assert set(mp_sections) == {"[Rule]", "[URL Rewrite]", "[Body Rewrite]", "[Map Local]", "[MITM]"}
assert "[Script]" not in mp_sections
assert "mobile.12306.cn" not in mp_text
assert "applets.jtexpress.com.cn" not in mp_text

for rule in mp_sections["[Rule]"]:
    assert rule.endswith(",REJECT,extended-matching"), rule

for jq_line in mp_sections["[Body Rewrite]"]:
    directive, pattern, quoted_expr = jq_line.split(" ", 2)
    assert directive == "http-response-jq"
    expr, = shlex.split(quoted_expr, posix=True)
    # Must safely pass through unexpected JSON types
    for passthrough in (None, [], "str", 123, {}):
        assert run_jq(expr, passthrough) == passthrough

# Verify specific JQ transformations on synthetic data
_, _, meituan_quoted = [l for l in mp_sections["[Body Rewrite]"] if "rms\\.meituan\\.com" in l][0].split(" ", 2)
meituan_expr, = shlex.split(meituan_quoted, posix=True)
assert run_jq(meituan_expr, {"data": {"popUpWindows": [{"id": 1}], "shopName": "Sample"}}) == {
    "data": {"shopName": "Sample"}
}

_, _, chong_quoted = [l for l in mp_sections["[Body Rewrite]"] if "GetProduct4App" in l][0].split(" ", 2)
chong_expr, = shlex.split(chong_quoted, posix=True)
assert run_jq(
    chong_expr,
    {
        "respInfo": {
            "reserveProductList": [{"id": 1}],
            "shortcut": [{"name": "充流量"}, {"name": "领话费券"}, {"name": "自动充"}],
        }
    },
) == {"respInfo": {"shortcut": [{"name": "自动充"}]}}

mitm_line, = mp_sections["[MITM]"]
mitm_hosts = [h.strip() for h in mitm_line.removeprefix("hostname = %APPEND% ").split(",")]
assert len(mitm_hosts) == len(set(mitm_hosts)), "Duplicate MITM hosts found"
assert "ad.maoyan.com" not in mitm_hosts
assert "mobile.12306.cn" not in mitm_hosts

print("PASS: WeChat Official Accounts & Mini Programs modules verified (script-free, guarded JQ, clean MITM)")
