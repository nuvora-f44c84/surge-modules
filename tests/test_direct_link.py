#!/usr/bin/env python3
"""Verification tests for modules/Direct-Link.sgmodule and scripts/Direct-Link.js."""

import json
import pathlib
import re
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "modules" / "Direct-Link.sgmodule"
SCRIPT_PATH = ROOT / "scripts" / "Direct-Link.js"
DOC_PATH = ROOT / "docs" / "direct-link.md"


def run_direct_link_js(request_url: str) -> dict:
    harness = f"""
const fs = require("fs");
const code = fs.readFileSync({json.dumps(str(SCRIPT_PATH))}, "utf8");
global.$request = {{ url: {json.dumps(request_url)} }};
global.$done = (result) => {{
  process.stdout.write(JSON.stringify(result || {{}}));
}};
eval(code);
"""
    proc = subprocess.run(
        ["node", "-e", harness],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(proc.stdout)


class DirectLinkModuleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module_text = MODULE_PATH.read_text(encoding="utf-8")
        cls.script_text = SCRIPT_PATH.read_text(encoding="utf-8")
        cls.doc_text = DOC_PATH.read_text(encoding="utf-8")

        match = re.search(
            r"^direct-link-request\s*=\s*type=http-request,pattern=([^,]+),requires-body=0,",
            cls.module_text,
            flags=re.M,
        )
        assert match, "direct-link-request script line not found"
        raw_pattern = match.group(1)
        if raw_pattern.startswith("(?i)"):
            cls.url_regex = re.compile(raw_pattern[4:], re.IGNORECASE)
        else:
            cls.url_regex = re.compile(raw_pattern)

    def test_module_metadata_and_mitm(self):
        self.assertIn("#!name=外链中转页 · 自动直跳", self.module_text)
        self.assertIn("#!version=0.1.0", self.module_text)
        self.assertNotIn("weixin110.qq.com", self.module_text.splitlines()[-1])
        for host in (
            "link.zhihu.com",
            "link.csdn.net",
            "link.juejin.cn",
            "www.jianshu.com",
            "jianshu.com",
            "c.pc.qq.com",
            "mail.qq.com",
            "weibo.cn",
        ):
            self.assertIn(host, self.module_text)

    def test_url_regex_matches_supported_endpoints_and_ignores_normal_pages(self):
        should_match = [
            "https://link.zhihu.com/?target=https%3A%2F%2Fgithub.com",
            "https://link.csdn.net/?from_id=123&target=https%3A%2F%2Fexample.com",
            "https://link.juejin.cn/?target=https%3A%2F%2Fexample.com",
            "https://www.jianshu.com/go-wild?ac=2&url=https%3A%2F%2Fexample.com",
            "https://jianshu.com/go-wild?url=https%3A%2F%2Fexample.com",
            "https://c.pc.qq.com/middlem.html?pfurl=https%3A%2F%2Fexample.com",
            "https://c.pc.qq.com/ios.html?url=https%3A%2F%2Fexample.com",
            "https://mail.qq.com/cgi-bin/readtemplate?t=safety&gourl=https%3A%2F%2Fexample.com",
            "https://weibo.cn/sinaurl?u=https%3A%2F%2Fexample.com",
        ]
        for url in should_match:
            self.assertIsNotNone(self.url_regex.search(url), f"Expected match: {url}")

        should_not_match = [
            "https://www.zhihu.com/question/12345",
            "https://www.jianshu.com/p/123456",
            "https://mail.qq.com/cgi-bin/frame_html?sid=123",
            "https://weibo.cn/u/123456",
            "https://weixin110.qq.com/cgi-bin/mmspamsupport-bin/newredirectconfirmcgi",
        ]
        for url in should_not_match:
            self.assertIsNone(self.url_regex.search(url), f"Expected non-match: {url}")

    def test_js_decodes_single_and_double_encoded_targets(self):
        cases = [
            (
                "https://link.zhihu.com/?target=https%3A%2F%2Fgithub.com%2Fnuvora-f44c84%2Fsurge-modules%3Ftab%3Dreadme",
                "https://github.com/nuvora-f44c84/surge-modules?tab=readme",
            ),
            (
                "https://link.csdn.net/?from_id=1&target=https%253A%252F%252Fdeveloper.apple.com%252Fdocumentation",
                "https://developer.apple.com/documentation",
            ),
            (
                "https://link.juejin.cn/?target=https%3A%2F%2Fnews.ycombinator.com%2F",
                "https://news.ycombinator.com/",
            ),
            (
                "https://www.jianshu.com/go-wild?ac=2&url=https%3A%2F%2Fexample.org%2Fpath%2Fto%2Fpage",
                "https://example.org/path/to/page",
            ),
            (
                "https://c.pc.qq.com/middlem.html?pfurl=https%3A%2F%2Fdocs.python.org%2F3%2F",
                "https://docs.python.org/3/",
            ),
            (
                "https://mail.qq.com/cgi-bin/readtemplate?check=false&gourl=https%3A%2F%2F manual.nssurge.com".replace(
                    " ", ""
                ),
                "https://manual.nssurge.com",
            ),
            (
                "https://weibo.cn/sinaurl?u=https%3A%2F%2Fgithub.com%2F",
                "https://github.com/",
            ),
        ]
        for req_url, expected_location in cases:
            res = run_direct_link_js(req_url)
            self.assertIn("response", res, f"Expected redirect response for {req_url}")
            self.assertEqual(res["response"]["status"], 302)
            self.assertEqual(res["response"]["headers"]["Location"], expected_location)

    def test_js_passthrough_on_opaque_token_or_unsafe_scheme(self):
        passthrough_cases = [
            "https://weibo.cn/sinaurl?f=w&u=http",
            "https://weibo.cn/sinaurl?luicode=10000011&lfid=231522",
            "https://link.zhihu.com/?target=javascript%3Aalert(1)",
            "https://link.zhihu.com/?target=data%3Atext%2Fhtml%2C%3Cscript%3Ealert(1)%3C%2Fscript%3E",
            "https://link.zhihu.com/?target=https%3A%2F%2Fexample.com%0D%0ASet-Cookie%3A%20evil%3D1",
            "https://mail.qq.com/cgi-bin/readtemplate?t=compose",
        ]
        for req_url in passthrough_cases:
            res = run_direct_link_js(req_url)
            self.assertEqual(res, {}, f"Expected passthrough for {req_url}")

    def test_doc_mentions_scope_and_wechat_exclusion(self):
        self.assertIn("weixin110.qq.com", self.doc_text)
        self.assertIn("Direct-Link.sgmodule", self.doc_text)


if __name__ == "__main__":
    unittest.main()
