"""Check Surge syntax, URL boundaries, script options and MITM hosts for Umetrip."""
import json
from pathlib import Path
import re
import shlex

module_text = (Path(__file__).resolve().parent.parent /
               "modules/Umetrip-AdBlock-Lite.sgmodule").read_text(encoding="utf-8")

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

assert metadata["version"] == "0.2.1"
assert "SPDX-License-Identifier" not in module_text
assert "loon_version" not in metadata
assert "tag" not in metadata
assert metadata["category"] == "去广告"
assert set(sections) == {"[Rule]", "[URL Rewrite]", "[Map Local]", "[Script]", "[MITM]"}

assert sections["[Rule]"] == [
    "DOMAIN,sensors.umetrip.com.cn,REJECT",
    "DOMAIN,analytics.umetrip.com,REJECT",
]

rewrite_rule, = sections["[URL Rewrite]"]
rewrite_pattern, rewrite_target, rewrite_action = rewrite_rule.split()
assert rewrite_target == "_" and rewrite_action == "reject"
for host in ("discardrp.umetrip.com", "startup.umetrip.com"):
    for suffix in ("", "?v=1", "/extra"):
        assert re.search(rewrite_pattern, f"https://{host}/gateway/api/umetrip/native{suffix}")
assert not re.search(rewrite_pattern, "https://home.umetrip.com/gateway/api/umetrip/native")
assert not re.search(rewrite_pattern, "https://startup.umetrip.com/gateway/api/umetrip/native-other")

map_local_rule, = sections["[Map Local]"]
ml_pattern, ml_params = map_local_rule.split(" ", 1)
for suffix in ("", "/", "/config.json", "?ts=1"):
    assert re.search(ml_pattern, f"https://oss.umetrip.com/fs/advert/polite{suffix}")
assert not re.search(ml_pattern, "https://oss.umetrip.com/fs/advert/polite-other")
assert not re.search(ml_pattern, "https://oss.umetrip.com/fs/static/icon.png")
ml_options = dict(part.split("=", 1) for part in shlex.split(ml_params))
assert ml_options == {
    "data-type": "text",
    "data": "{}",
    "status-code": "200",
    "header": "Content-Type:application/json",
}
assert json.loads(ml_options["data"]) == {}

script_line, = sections["[Script]"]
script_name, script_rhs = [part.strip() for part in script_line.split("=", 1)]
assert script_name == "umetrip-adblock-response"
script_opts = dict(item.split("=", 1) for item in script_rhs.split(","))
assert script_opts["type"] == "http-response"
assert script_opts["requires-body"] == "true"
assert script_opts["binary-body-mode"] == "true"
assert script_opts["engine"] == "webview"
assert int(script_opts["max-size"]) >= 300000
assert script_opts["timeout"] == "30"
# Remote script must stay pinned to a full 40-hex commit, never a branch.
assert re.fullmatch(
    r"https://raw\.githubusercontent\.com/xingjiu29/Umetrip/[0-9a-f]{40}/umetrip\.js",
    script_opts["script-path"],
), script_opts["script-path"]

script_pattern = script_opts["pattern"]
assert script_pattern.startswith("(?i)")
compiled = re.compile(script_pattern[4:], re.IGNORECASE)
for host in (
    "bkclient.umetrip.com.cn",
    "umerp.umetrip.com",
    "umerp.umetrip.com.cn",
    "home.umetrip.com",
    "umehome.umetrip.com",
    "sns.umetrip.com",
    "appmsg.umetrip.com",
):
    for suffix in ("", "?rpid=1000002&v=1"):
        assert compiled.search(f"https://{host}/gateway/api/umetrip/native{suffix}"), host
for non_target in (
    "https://oss.umetrip.com/fs/advert/polite",
    "https://startup.umetrip.com/gateway/api/umetrip/native",
    "https://home.umetrip.com/gateway/api/umetrip/native/sub",
    "https://home.umetrip.com.example.com/gateway/api/umetrip/native",
):
    assert not compiled.search(non_target), non_target

mitm_line, = sections["[MITM]"]
assert mitm_line.startswith("hostname = %APPEND% ")
mitm_hosts = [h.strip() for h in mitm_line.removeprefix("hostname = %APPEND% ").split(",")]
assert mitm_hosts == [
    "umerp.umetrip.com",
    "umerp.umetrip.com.cn",
    "home.umetrip.com",
    "bkclient.umetrip.com.cn",
    "discardrp.umetrip.com",
    "startup.umetrip.com",
    "oss.umetrip.com",
    "umehome.umetrip.com",
    "sns.umetrip.com",
    "appmsg.umetrip.com",
]
print("PASS: Umetrip Surge module syntax, rewrite/map-local boundaries, webview binary script and MITM hosts")
