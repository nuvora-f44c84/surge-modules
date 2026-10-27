"""Check the published filter's URL scope and response compatibility, using synthetic data."""
import json
from pathlib import Path
import re
import shlex
import subprocess

root = Path(__file__).resolve().parent.parent
module = (root / "modules/Douban-Splash-AdBlock.sgmodule").read_text()
rules = [line.split(" ", 2) for line in module.splitlines() if line.startswith("http-response-jq ")]
assert len(rules) == 2
_, pattern, quoted_expression = rules[0]
expression, = shlex.split(quoted_expression, posix=True)
_, show_pattern, show_quoted_expression = rules[1]
show_expression, = shlex.split(show_quoted_expression, posix=True)
for path in ("splash", "splash_preload", "splash_preload?test=1", "splash/"):
    assert re.search(pattern, "https://api.douban.com/v2/app_ads/" + path)
for url in (
    "https://api.douban.com/v2/app_ads/feed",
    "https://api.douban.com/v2/app_ads/splash_other",
    "https://api.douban.com/v2/app_ads/splash_report",
    "https://api.douban.com/v2/app_ads/splash_statistics",
    "https://api.douban.com/v2/app_ads/splash_preload/other",
    "https://api.douban.com/v2/user/me",
    "https://frodo.douban.com/api/v2/subject_collection/movie_showing/items",
    "https://api.douban.com.example.org/v2/app_ads/splash_preload",
):
    assert not re.search(pattern, url), url
    assert not re.search(show_pattern, url), url
for path in ("splash_show", "splash_show/", "splash_show?test=1"):
    url = "https://api.douban.com/v2/app_ads/" + path
    assert re.search(show_pattern, url)
    assert not re.search(pattern, url)
for path in ("splash", "splash_preload", "splash_show_other", "splash_show/other"):
    assert not re.search(show_pattern, "https://api.douban.com/v2/app_ads/" + path)

def run(value, filter_expression=expression):
    result = subprocess.run(["jq", "-c", filter_expression], input=json.dumps(value),
                            text=True, capture_output=True, check=True)
    assert len(result.stdout.splitlines()) == 1
    return json.loads(result.stdout)

value = {"ads": [{"ad_place": ["splash_screen", "splash_resume"], "ad_duration": 5000}],
         "preload_ids": ["synthetic-cache-id"], "preload_uniq_ids": ["synthetic-unique-id"],
         "settings": {"keep": True}}
expected = {"ads": [], "preload_ids": None, "preload_uniq_ids": [], "settings": {"keep": True}}
assert run(value) == expected
assert run(expected) == expected
assert run({"ads": [{"ad_id": "sample"}]}) == {"ads": []}
for value in (None, [], "unexpected", 1, {}, {"error": "unauthorized"},
              {"ads": None, "preload_ids": ["keep"]}, {"ads": {"unknown": True}}):
    assert run(value) == value

# Independently constructed fixtures; no captured responses or identifiers.
show = {"ad_info": {"ad_video_url": "https://ads.example.invalid/sample.mp4"},
        "preload_ad_id": "synthetic-preload", "preload_ad_info": {"example": True},
        "backup_ad_id": "synthetic-backup", "backup_ad_info": {"example": True},
        "sdk_info": '[{"provider":"synthetic-provider"}]',
        "ad_bid_info": '{"candidate":"synthetic-candidate"}',
        "interval": 120, "sleep_time": 15, "settings": {"keep": True}}
show_expected = {**show, "ad_info": None, "preload_ad_id": None, "preload_ad_info": None,
                 "backup_ad_id": None, "backup_ad_info": None, "sdk_info": "[]", "ad_bid_info": "{}"}
assert run(show, show_expression) == show_expected
assert run(show_expected, show_expression) == show_expected
assert run({"ad_info": None, "sdk_info": [{"example": True}],
            "ad_bid_info": {"example": True}}, show_expression) == {
                "ad_info": None, "sdk_info": [], "ad_bid_info": {}}
assert run({"ad_info": {}}, show_expression) == {"ad_info": None}
for value in (None, [], "unexpected", 1, {}, {"error": "unauthorized"},
              {"ad_info": "unexpected", "sdk_info": "preserve"},
              {"ad_info": ["unexpected"]}, {"ads": [{"example": True}]}):
    assert run(value, show_expression) == value
assert run({"ad_info": None, "sdk_info": None, "ad_bid_info": None}, show_expression) == {
    "ad_info": None, "sdk_info": None, "ad_bid_info": None}
assert "hostname = %APPEND% api.douban.com" in module
assert "[Rule]" not in module and "[Script]" not in module
print("PASS: endpoint boundaries, preload/display/SDK ads, cache IDs, preserved metadata and unknown responses")
