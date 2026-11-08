"""Check syntax, JQ safety, preserved wallet/nav fields and MITM scope for DiDi."""
import json
from pathlib import Path
import re
import shlex
import subprocess

root = Path(__file__).resolve().parent.parent
module_text = (root / "modules/DiDi-AdBlock-Lite.sgmodule").read_text(encoding="utf-8")

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

assert metadata["name"] == "滴滴出行 · 广告过滤"
assert metadata["version"] == "0.1.0"
assert set(sections) == {"[Rule]", "[Body Rewrite]", "[Map Local]", "[MITM]"}
assert "[Script]" not in sections

assert sections["[Rule]"] == [
    "DOMAIN,gwp.xiaojukeji.com,REJECT,extended-matching",
    "DOMAIN,gwpgz.diditaxi.com.cn,REJECT,extended-matching",
    "DOMAIN,adtrack.xiaojukeji.com,REJECT,extended-matching",
]

# Ensure aggressive whitelists on usercenter/layout and homepage/core were removed.
assert "usercenter/layout" not in module_text
assert "homepage/v\\d/core" not in module_text


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


patterns = []
for jq_line in sections["[Body Rewrite]"]:
    directive, pattern, quoted_expr = jq_line.split(" ", 2)
    assert directive == "http-response-jq"
    patterns.append(pattern)
    expr, = shlex.split(quoted_expr, posix=True)
    for passthrough in (None, [], "str", 123, {}):
        assert run_jq(expr, passthrough) == passthrough

# No duplicate URL patterns in [Body Rewrite]
assert len(patterns) == len(set(patterns)), "Duplicate JQ URL patterns found"

# Test fast homepage cleanup on synthetic fixture
_, _, fast_quoted = [l for l in sections["[Body Rewrite]"] if "other/fast" in l][0].split(" ", 2)
fast_expr, = shlex.split(fast_quoted, posix=True)
fast_sample = {
    "data": {
        "disorder_cards": {
            "communicate_card": {"ad": True},
            "guess_card": {"ad": True},
            "normal_card": {"keep": True},
        },
        "order_cards": [{"ad": True}],
        "keep_meta": 1,
    }
}
assert run_jq(fast_expr, fast_sample) == {
    "data": {
        "disorder_cards": {"normal_card": {"keep": True}},
        "keep_meta": 1,
    }
}

# Test POI rec_destination deletion
_, _, poi_quoted = [l for l in sections["[Body Rewrite]"] if "poi\\.map\\.xiaojukeji\\.com" in l][0].split(" ", 2)
poi_expr, = shlex.split(poi_quoted, posix=True)
assert run_jq(poi_expr, {"rec_destination": [{"name": "ad"}], "poi_list": [{"name": "Station"}]}) == {
    "poi_list": [{"name": "Station"}]
}

mitm_line, = sections["[MITM]"]
mitm_hosts = [h.strip() for h in mitm_line.removeprefix("hostname = %APPEND% ").split(",")]
assert len(mitm_hosts) == 10
print("PASS: DiDi module syntax, deduplicated guarded JQ rules, no wallet/nav whitelists, and MITM scope")
