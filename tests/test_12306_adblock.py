"""Check Surge syntax, URL boundaries, JQ filter behavior and MITM scope for 12306."""
import json
from pathlib import Path
import re
import shlex
import subprocess

root = Path(__file__).resolve().parent.parent
module_text = (root / "modules/12306-AdBlock-Lite.sgmodule").read_text(encoding="utf-8")

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

assert metadata["name"] == "铁路 12306 · 广告过滤"
assert metadata["version"] == "0.1.0"
assert metadata["category"] == "去广告"
assert set(sections) == {"[Rule]", "[Body Rewrite]", "[MITM]"}
assert "[Script]" not in sections

assert sections["[Rule]"] == [
    "DOMAIN,ad.12306.cn,DIRECT,extended-matching",
]

jq_line, = sections["[Body Rewrite]"]
directive, pattern, quoted_expr = jq_line.split(" ", 2)
assert directive == "http-response-jq"
expression, = shlex.split(quoted_expr, posix=True)

assert pattern.startswith("(?i)")
compiled = re.compile(pattern[4:], re.IGNORECASE)
for target in (
    "https://ad.12306.cn/ad/ser/getAdList",
    "https://ad.12306.cn/ad/ser/getAdList/",
    "https://ad.12306.cn/ad/ser/getAdList?placementNo=0007",
    "https://AD.12306.CN/ad/ser/getAdList",
):
    assert compiled.search(target), target

for non_target in (
    "http://ad.12306.cn/ad/ser/getAdList",
    "https://ad.12306.cn/ad/ser/getAdList/extra",
    "https://ad.12306.cn/ad/ser/getAdListOther",
    "https://mobile.12306.cn/otsmobile/app/mgs/mgw.htm",
    "https://kyfw.12306.cn/otn/leftTicket/init",
    "https://ad.12306.cn.example.com/ad/ser/getAdList",
):
    assert not compiled.search(non_target), non_target


def run_jq(payload):
    result = subprocess.run(
        ["jq", "-c", expression],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        check=True,
    )
    assert len(result.stdout.splitlines()) == 1
    return json.loads(result.stdout)


# Synthetic fixtures representing splash (0007) and banner (G0054) responses.
splash_sample = {
    "code": "00",
    "rid": "synthetic-rid-001",
    "materialsList": [
        {"billMaterialsId": "synthetic-1", "filePath": "https://example.invalid/ad.jpg", "creativeType": 1}
    ],
    "advertParam": {"skipTime": 5, "showSkipBtn": 1},
    "extra": {"keep": True},
}
expected_clean = {
    "code": "00",
    "rid": "synthetic-rid-001",
    "extra": {"keep": True},
}
assert run_jq(splash_sample) == expected_clean
assert run_jq(expected_clean) == expected_clean

for passthrough in (
    None,
    [],
    "unexpected",
    123,
    {},
    {"code": "00", "message": "无广告返回"},
):
    assert run_jq(passthrough) == passthrough

mitm_line, = sections["[MITM]"]
assert mitm_line == "hostname = %APPEND% ad.12306.cn"
assert "mobile.12306.cn" not in module_text.splitlines()[-1]
print("PASS: 12306 module syntax, URL boundaries, JQ rewrite and MITM scope")
