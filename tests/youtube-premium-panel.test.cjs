const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const scriptPath = path.join(repoRoot, "scripts/YouTube-Premium-Panel.js");
const modulePath = path.join(repoRoot, "modules/YouTube-Premium-Panel.sgmodule");
const code = fs.readFileSync(scriptPath, "utf8");
const sgmodule = fs.readFileSync(modulePath, "utf8");
const P = require(scriptPath);

// Synthetic landing-page fixtures only; no recorded responses or personal data.
function syntheticPage({
  region = "US",
  individualPrice = "$15.99\u200b/month",
  liteOnly = false,
  disabled = false,
  unavailable = false,
  unverified = false,
  standalone = false
} = {}) {
  const makeOption = (priceText, baseUrl) => ({
    lpOfferCardOptionViewModel: {
      title: { content: priceText },
      purchaseButtonOverride: {
        buttonViewModel: {
          state: disabled ? "BUTTON_VIEW_MODEL_STATE_DISABLED" : "BUTTON_VIEW_MODEL_STATE_ACTIVE",
          onTap: {
            innertubeCommand: {
              signInEndpoint: {
                nextEndpoint: {
                  browseEndpoint: {
                    browseId: "SPunlimited",
                    canonicalBaseUrl: baseUrl,
                    params: "synthetic-offer"
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const cards = standalone
    ? [makeOption(individualPrice, liteOnly ? "/premiumlite" : "/premium")]
    : liteOnly
      ? [
          {
            lpOfferCardViewModel: {
              title: { content: "Premium Lite" },
              offerOptions: [makeOption("$7.99/month", "/premiumlite")]
            }
          }
        ]
      : [
          {
            lpOfferCardViewModel: {
              title: { content: "Individual" },
              offerOptions: [
                makeOption("12 months for $159.99", "/premium"),
                makeOption(individualPrice, "/premium")
              ]
            }
          },
          {
            lpOfferCardViewModel: {
              title: { content: "Family" },
              offerOptions: [makeOption("$26.99/month", "/premium")]
            }
          }
        ];

  const statusText = unavailable
    ? "YouTube Premium is not available in your country"
    : unverified
      ? "We couldn't verify your country"
      : "YouTube Premium";

  const data = {
    contents: {
      sectionListRenderer: {
        contents: [...cards, { description: { simpleText: statusText } }]
      }
    }
  };

  const cfgPart = region
    ? `<script>ytcfg.set(${JSON.stringify({ INNERTUBE_CONTEXT_GL: region })});</script>`
    : "";
  return `<html>${cfgPart}<script>var ytInitialData = ${JSON.stringify(data)};</script></html>`;
}

function runSurgePanel(options = {}) {
  let now = Date.parse(options.date || "2030-05-01T04:30:00Z");
  const results = [];
  const timers = [];
  const requests = [];
  const callbacks = [];

  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
    static now() {
      return now;
    }
    getHours() {
      return 12;
    }
    getMinutes() {
      return 30;
    }
  }

  vm.runInNewContext(code, {
    Date: FixedDate,
    Intl,
    $argument:
      options.argument ??
      "_raw=1&timeout=8&price=true&title=YouTube Premium&policy=auto",
    $done: payload => results.push(JSON.parse(JSON.stringify(payload))),
    setTimeout: (fn, delay) => timers.push({ fn, delay }),
    $httpClient: {
      get: (req, cb) => {
        requests.push(JSON.parse(JSON.stringify(req)));
        callbacks.push(cb);
      }
    }
  });

  return {
    results,
    timers,
    requests,
    reply: ({ data = "", status = 200, headers = {}, error = null, index = 0, elapsedMs = 215 } = {}) => {
      now += elapsedMs;
      callbacks[index](error, { status, headers }, data);
    }
  };
}

test("module file uses stable raw remote script path and requires no MITM or rules", () => {
  assert.match(sgmodule, /^#!name=YouTube · Premium 解锁面板$/m);
  assert.match(sgmodule, /^#!version=0\.1\.0$/m);
  assert.match(
    sgmodule,
    /script-path=https:\/\/raw\.githubusercontent\.com\/nuvora-f44c84\/surge-modules\/main\/scripts\/YouTube-Premium-Panel\.js/
  );
  assert.doesNotMatch(sgmodule, /\[MITM\]|\[Rule\]|\[Body Rewrite\]|\[URL Rewrite\]/);
  assert.match(sgmodule, /\[Script\]/);
  assert.match(sgmodule, /\[Panel\]/);
});

test("default auto policy follows Surge routing rules without Cookie header and extracts Individual monthly price", () => {
  const r = runSurgePanel();
  assert.equal(r.requests.length, 1);
  assert.equal(r.requests[0].url, "https://www.youtube.com/premium?hl=en");
  assert.equal(r.requests[0].policy, undefined);
  assert.equal(r.requests[0]["auto-redirect"], false);
  assert.equal(r.requests[0].headers.Cookie, undefined);

  r.reply({ data: syntheticPage({ region: "US", individualPrice: "$15.99\u200b/month" }), elapsedMs: 220 });
  assert.deepEqual(r.results, [
    {
      title: "YouTube Premium · 已解锁",
      content: "地区：🇺🇸 美国 (US) · 个人 $15.99/月\n策略：当前规则 · 220 ms · 12:30",
      icon: "play.rectangle.fill",
      "icon-color": "#34C759"
    }
  ]);
});

test("raw module argument preserves special characters like %, +, |, & and spaces in policy names", () => {
  const complexPolicy = "🇭🇰 香港 01 | IEPL + BGP & 50%倍率";
  const r = runSurgePanel({
    argument: `_raw=1&timeout=10&price=false&title=YT 解锁&policy=${complexPolicy}`
  });
  assert.equal(r.requests[0].policy, complexPolicy);
  assert.equal(r.requests[0].timeout, 10);

  r.reply({ data: syntheticPage({ region: "HK", individualPrice: "HK$78.00/month" }), elapsedMs: 95 });
  assert.equal(r.results[0].title, "YT 解锁 · 已解锁");
  assert.match(r.results[0].content, /^地区：🇭🇰 香港 \(HK\)\n策略：🇭🇰 香港 01 \| IEPL… · 95 ms · 12:30$/);
});

test("TW region omits U+1F1F9 U+1F1FC flag sequence so CH/A hardware never renders a missing glyph box", () => {
  assert.equal(P.countryFlag("TW"), "");
  assert.equal(P.formatRegion("TW", false), "台湾 (TW)");
  assert.ok(!P.formatRegion("TW", false).includes("\uD83C\uDDF9\uD83C\uDDFC"));

  const r = runSurgePanel();
  r.reply({ data: syntheticPage({ region: "TW", individualPrice: "NT$199.00/month" }), elapsedMs: 110 });
  assert.equal(
    r.results[0].content,
    "地区：台湾 (TW) · 个人 NT$199.00/月\n策略：当前规则 · 110 ms · 12:30"
  );
  assert.ok(!JSON.stringify(r.results).includes("\uD83C\uDDF9\uD83C\uDDFC"));
});

test("distinguishes region_unavailable, lite_only, country_unverified, challenge redirects, rate limits and invalid policies", () => {
  // 1. Unavailable with detected region (e.g. Macau)
  const unavail = runSurgePanel();
  unavail.reply({ data: syntheticPage({ region: "MO", unavailable: true }), elapsedMs: 88 });
  assert.equal(unavail.results[0].title, "YouTube Premium · 未解锁");
  assert.match(unavail.results[0].content, /地区：🇲🇴 澳门 \(MO\) · 该地区未提供服务/);
  assert.equal(unavail.results[0]["icon-color"], "#FF3B30");

  // 2. Premium Lite only
  const lite = runSurgePanel();
  lite.reply({ data: syntheticPage({ region: "TH", liteOnly: true }), elapsedMs: 160 });
  assert.equal(lite.results[0].title, "YouTube Premium · 仅 Lite");
  assert.match(lite.results[0].content, /地区：🇹🇭 泰国 \(TH\) · 仅检测到 Lite \(\$7\.99\/月\)/);
  assert.equal(lite.results[0]["icon-color"], "#FF9500");

  // 3. Country unverified
  const unverified = runSurgePanel();
  unverified.reply({ data: syntheticPage({ region: "US", unverified: true }), elapsedMs: 190 });
  assert.equal(unverified.results[0].title, "YouTube Premium · 国家未验证");
  assert.equal(unverified.results[0]["icon-color"], "#FF9500");

  // 4. HTTP 302 redirect to Google sorry / consent page
  for (const location of [
    "https://www.google.com/sorry/index?continue=https://www.youtube.com/premium",
    "https://consent.youtube.com/m?continue=https://www.youtube.com/premium"
  ]) {
    const ch = runSurgePanel();
    ch.reply({ status: 302, headers: { location }, data: "", elapsedMs: 130 });
    assert.equal(ch.results[0].title, "YouTube Premium · 触发验证");
    assert.equal(ch.results[0]["icon-color"], "#FF9500");
  }

  // 5. HTTP 429 rate limit
  const rl = runSurgePanel();
  rl.reply({ status: 429, data: "", elapsedMs: 100 });
  assert.equal(rl.results[0].title, "YouTube Premium · 请求受限");

  // 6. Non-existent Surge policy error
  const badPol = runSurgePanel({
    argument: "_raw=1&timeout=8&price=true&title=YouTube Premium&policy=MissingGroup"
  });
  badPol.reply({ error: "Policy not found: MissingGroup", elapsedMs: 5 });
  assert.equal(badPol.results[0].title, "YouTube Premium · 策略异常");
  assert.match(badPol.results[0].content, /MissingGroup/);
});

test("rejects generic marketing, disabled buttons, conflicting regions, oversized bodies and code execution attempts", () => {
  for (const html of [
    syntheticPage({ disabled: true }),
    "<html>YouTube Premium ad-free Get Premium</html>",
    syntheticPage().replaceAll("SPunlimited", "FEwhat_to_watch"),
    syntheticPage({ region: "" }),
    syntheticPage({ region: "XX" }),
    syntheticPage({ region: "US" }) + '<script>{"INNERTUBE_CONTEXT_GL":"JP"}</script>',
    "x".repeat(P.MAX_HTML + 1)
  ]) {
    assert.notEqual(P.classify({ status: 200, data: html }).status, "available");
  }

  const tricky = { contents: { label: 'brace } and quote " and \\' } };
  assert.deepEqual(
    P.initialData(`window["ytInitialData"] = ${JSON.stringify(tricky)}; throw new Error("never run");`),
    tricky
  );
  assert.equal(P.initialData('var ytInitialData = {"contents": evil()};'), null);
});

test("multi-policy comparison works with both comma-separated module policy and URL-encoded script arguments, surviving partial timeouts", () => {
  const r1 = runSurgePanel({
    argument: "_raw=1&timeout=6&price=true&title=YT 对比&policy=ProxyJP,DIRECT"
  });
  assert.equal(r1.requests.length, 2);
  assert.equal(r1.requests[0].policy, "ProxyJP");
  assert.equal(r1.requests[1].policy, "DIRECT");

  r1.reply({ index: 0, data: syntheticPage({ region: "JP", individualPrice: "¥1,280/month" }), elapsedMs: 150 });
  assert.equal(r1.results.length, 0);
  r1.timers[0].fn(); // Second policy times out at deadline

  assert.equal(r1.results.length, 1);
  assert.equal(r1.results[0].title, "YT 对比 · 1/2 已解锁 · 12:30");
  assert.equal(
    r1.results[0].content,
    "ProxyJP：已解锁 · 🇯🇵 日本 · ¥1,280/月 · 150ms\nDIRECT：超时 (>6s) (150ms)"
  );
  assert.equal(r1.results[0]["icon-color"], "#FF9500");

  // Standalone URL-encoded indexed arguments
  const r2 = runSurgePanel({
    argument: new URLSearchParams({
      policy1: "Example US",
      name1: "美区",
      policy2: "Example MO",
      name2: "澳区",
      price: "false",
      timeout: "5"
    }).toString()
  });
  assert.equal(r2.requests.length, 2);
  r2.reply({ index: 0, data: syntheticPage({ region: "US" }), elapsedMs: 180 });
  r2.reply({ index: 1, data: syntheticPage({ region: "MO", unavailable: true }), elapsedMs: 70 });
  assert.equal(r2.results[0].title, "YouTube Premium · 1/2 已解锁 · 12:30");
  assert.equal(
    r2.results[0].content,
    "美区：已解锁 · 🇺🇸 美国 · 180ms\n澳区：未解锁 · 🇲🇴 澳门 · 250ms"
  );
  assert.equal(r2.results[0]["icon-color"], "#FF3B30");
});

test("malformed arguments finish cleanly without sending network requests", () => {
  for (const badArg of [
    "_raw=1&timeout=1&price=true&title=YT&policy=auto",
    "_raw=1&timeout=99&price=true&title=YT&policy=auto",
    "_raw=1&timeout=8&price=true&title=YT&policy=A,B,C,D,E",
    "policy=%E0%A4%A"
  ]) {
    const r = runSurgePanel({ argument: badArg });
    assert.equal(r.requests.length, 0);
    assert.equal(r.results.length, 1);
    assert.match(r.results[0].title, /参数异常/);
  }
});
