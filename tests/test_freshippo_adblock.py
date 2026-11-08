"""Check syntax, querysinglepage conflict resolution, JQ safety and MITM scope for Freshippo."""
import json
from pathlib import Path
import shlex
import subprocess

root = Path(__file__).resolve().parent.parent
module_text = (root / "modules/Freshippo-AdBlock-Lite.sgmodule").read_text(encoding="utf-8")

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

assert metadata["name"] == "盒马 · 广告与页面精简"
assert metadata["version"] == "0.1.0"
assert set(sections) == {"[Body Rewrite]", "[Map Local]", "[MITM]"}
assert "[Script]" not in sections

# Ensure querysinglepage is NOT shadowed in [Map Local]
for ml in sections["[Map Local]"]:
    assert "querysinglepage" not in ml, ml


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


for jq_line in sections["[Body Rewrite]"]:
    directive, pattern, quoted_expr = jq_line.split(" ", 2)
    assert directive == "http-response-jq"
    expr, = shlex.split(quoted_expr, posix=True)
    for passthrough in (None, [], "str", 123, {}, {"data": None}, {"data": {"scenes": None}}):
        assert run_jq(expr, passthrough) == passthrough

# Test bottom tab bar filtering
_, _, tab_quoted = [l for l in sections["[Body Rewrite]"] if "shopdecideapi" in l][0].split(" ", 2)
tab_expr, = shlex.split(tab_quoted, posix=True)
tab_sample = {
    "data": {
        "groupList": [
            {
                "ext": {
                    "tabConfig": {
                        "normalTabList": [
                            {"code": "HOME"},
                            {"code": "VIDEO_FEED"},
                            {"code": "CLASSIFY"},
                            {"code": "CART"},
                            {"code": "MY"},
                        ],
                        "normalTabListB": [
                            {"code": "HOME"},
                            {"code": "PROMO"},
                            {"code": "MY"},
                        ],
                    }
                }
            }
        ]
    }
}
assert run_jq(tab_expr, tab_sample) == {
    "data": {
        "groupList": [
            {
                "ext": {
                    "tabConfig": {
                        "normalTabList": [
                            {"code": "HOME"},
                            {"code": "CLASSIFY"},
                            {"code": "CART"},
                            {"code": "MY"},
                        ],
                        "normalTabListB": [
                            {"code": "HOME"},
                            {"code": "MY"},
                        ],
                    }
                }
            }
        ]
    }
}

assert sections["[MITM]"] == ["hostname = %APPEND% acs-m.freshippo.com"]
print("PASS: Freshippo module syntax, querysinglepage unshadowed, guarded JQ and single MITM host")
