// YouTube Premium unlock status panel v0.1.1.
// Queries the public https://www.youtube.com/premium?hl=en landing page without cookies,
// verifies an active SPunlimited (/premium) purchase offer, and resolves the actual leaf
// proxy node name (e.g. "🇺🇸 Dmit") via Surge's internal $httpAPI / $surge APIs.
(function (root) {
  "use strict";

  const VERSION = "0.1.1";
  const MAX_HTML = 2500000;
  const MAX_NODES = 25000;
  const MAX_POLICIES = 4;
  const NODE_LOOKUP_TIMEOUT_MS = 300;
  const TARGET_URL = "https://www.youtube.com/premium?hl=en";
  const UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

  const REGION_NAMES = {
    AE: "阿联酋",
    AR: "阿根廷",
    AT: "奥地利",
    AU: "澳大利亚",
    BE: "比利时",
    BG: "保加利亚",
    BR: "巴西",
    BY: "白俄罗斯",
    CA: "加拿大",
    CH: "瑞士",
    CL: "智利",
    CN: "中国大陆",
    CO: "哥伦比亚",
    CZ: "捷克",
    DE: "德国",
    DK: "丹麦",
    EG: "埃及",
    ES: "西班牙",
    FI: "芬兰",
    FR: "法国",
    GB: "英国",
    GR: "希腊",
    HK: "香港",
    HU: "匈牙利",
    ID: "印尼",
    IE: "爱尔兰",
    IL: "以色列",
    IN: "印度",
    IS: "冰岛",
    IT: "意大利",
    JP: "日本",
    KH: "柬埔寨",
    KP: "朝鲜",
    KR: "韩国",
    KZ: "哈萨克斯坦",
    LA: "老挝",
    LU: "卢森堡",
    MM: "缅甸",
    MN: "蒙古",
    MO: "澳门",
    MX: "墨西哥",
    MY: "马来西亚",
    NG: "尼日利亚",
    NL: "荷兰",
    NO: "挪威",
    NZ: "新西兰",
    PE: "秘鲁",
    PH: "菲律宾",
    PK: "巴基斯坦",
    PL: "波兰",
    PT: "葡萄牙",
    RO: "罗马尼亚",
    RS: "塞尔维亚",
    RU: "俄罗斯",
    SA: "沙特",
    SE: "瑞典",
    SG: "新加坡",
    TH: "泰国",
    TR: "土耳其",
    TW: "台湾",
    UA: "乌克兰",
    US: "美国",
    VN: "越南",
    ZA: "南非"
  };

  let intlRegionNames = null;
  try {
    if (typeof Intl === "object" && Intl && typeof Intl.DisplayNames === "function") {
      intlRegionNames = new Intl.DisplayNames(["zh-Hans"], { type: "region" });
    }
  } catch (_) {}

  function validRegionCode(code) {
    return typeof code === "string" && /^[A-Z]{2}$/.test(code) && !["AA", "XX", "ZZ"].includes(code)
      ? code
      : null;
  }

  function countryFlag(code) {
    const valid = validRegionCode(code);
    // Omit U+1F1F9 U+1F1FC so Mainland (CH/A) iOS CoreText never renders a missing-glyph box.
    if (!valid || valid === "TW") return "";
    return Array.from(valid)
      .map(c => String.fromCodePoint(127397 + c.charCodeAt(0)))
      .join("");
  }

  function regionChineseName(code) {
    const valid = validRegionCode(code);
    if (!valid) return "";
    if (Object.prototype.hasOwnProperty.call(REGION_NAMES, valid)) {
      return REGION_NAMES[valid];
    }
    if (intlRegionNames) {
      try {
        const name = intlRegionNames.of(valid);
        if (typeof name === "string" && name.trim() && name !== valid) {
          return name.trim();
        }
      } catch (_) {}
    }
    return valid;
  }

  function formatRegion(code, compact = false) {
    const valid = validRegionCode(code);
    if (!valid) return "未知地区";
    const flag = countryFlag(valid);
    const name = regionChineseName(valid);
    if (compact) {
      if (flag) return `${flag} ${name}`;
      return name === valid ? valid : `${name} (${valid})`;
    }
    const label = name === valid ? valid : `${name} (${valid})`;
    return flag ? `${flag} ${label}` : label;
  }

  function cleanText(value, maxLen = 24) {
    const cleaned = String(value || "")
      .replace(/[\u200b-\u200f\ufeff\r\n\t\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const chars = Array.from(cleaned);
    return chars.length > maxLen ? chars.slice(0, maxLen - 1).join("") + "…" : cleaned;
  }

  function formatTime(date) {
    const d = date instanceof Date ? date : new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // Parse the public landing page as JSON data only; never execute downloaded code.
  function initialData(html) {
    const marker =
      /(?:\b(?:var|let|const)\s+)?\bytInitialData\s*=\s*|window\s*\[\s*["']ytInitialData["']\s*\]\s*=\s*/g;
    const match = marker.exec(html);
    if (!match) return null;
    const start = marker.lastIndex;
    if (html[start] !== "{") return null;
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let i = start; i < html.length; i += 1) {
      const c = html[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (c === "\\") escaped = true;
        else if (c === '"') quoted = false;
        continue;
      }
      if (c === '"') quoted = true;
      else if (c === "{") depth += 1;
      else if (c === "}" && --depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch (_) {
          return null;
        }
      }
    }
    return null;
  }

  function collectObjects(value) {
    const out = [];
    const queue = [value];
    let head = 0;
    while (head < queue.length && out.length < MAX_NODES) {
      const current = queue[head++];
      if (!current || typeof current !== "object") continue;
      out.push(current);
      for (const child of Object.values(current)) {
        if (child && typeof child === "object") queue.push(child);
      }
    }
    return head < queue.length ? [] : out;
  }

  function extractRegion(html) {
    if (typeof html !== "string" || !html.length) return null;
    const regions = Array.from(html.matchAll(/"INNERTUBE_CONTEXT_GL"\s*:\s*"([A-Z]{2})"/g)).map(
      m => m[1]
    );
    if (!regions.length || new Set(regions).size !== 1) return null;
    return validRegionCode(regions[0]);
  }

  function normalizePrice(rawTitle) {
    const text = String(rawTitle || "")
      .replace(/[\u200b-\u200f\ufeff\r\n\t\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text || !/\d/.test(text)) return null;
    const localized = text
      .replace(/\s*\/\s*(?:month|mo)\b/i, "/月")
      .replace(/\s*\/\s*(?:year|yr)\b/i, "/年");
    const chars = Array.from(localized);
    return chars.length <= 24 ? localized : chars.slice(0, 23).join("") + "…";
  }

  function inspectOption(option) {
    if (!option || typeof option !== "object") return null;
    const button =
      option.purchaseButtonOverride && option.purchaseButtonOverride.buttonViewModel;
    const rawTitle = option.title && option.title.content ? String(option.title.content) : "";
    if (!button || button.state !== "BUTTON_VIEW_MODEL_STATE_ACTIVE" || !/\d/.test(rawTitle)) {
      return null;
    }
    const tapNodes = collectObjects(button.onTap);
    let kind = null;
    for (const node of tapNodes) {
      const endpoint = node.browseEndpoint;
      if (
        endpoint &&
        endpoint.browseId === "SPunlimited" &&
        typeof endpoint.params === "string" &&
        endpoint.params.length > 0
      ) {
        if (endpoint.canonicalBaseUrl === "/premium") {
          kind = "full";
          break;
        }
        if (endpoint.canonicalBaseUrl === "/premiumlite" && !kind) {
          kind = "lite";
        }
      }
    }
    if (!kind) return null;
    return {
      kind,
      monthly: /\/\s*(?:month|mo)\b/i.test(rawTitle),
      price: normalizePrice(rawTitle)
    };
  }

  function httpStatus(value) {
    return Number.isInteger(value) && value >= 100 && value <= 599 ? value : 0;
  }

  function headerValue(headers, targetName) {
    if (!headers || typeof headers !== "object") return "";
    const lower = targetName.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (String(k).toLowerCase() === lower && typeof v === "string") return v;
    }
    return "";
  }

  function classify(response) {
    const make = (status, reason, region = null, extra = {}) => ({
      status,
      reason,
      region,
      price: null,
      planLabel: null,
      httpStatus: 0,
      ...extra
    });

    if (!response || response.error) {
      const errText = String((response && response.error) || "");
      if (/policy.*not found|invalid policy|no such policy|策略.*(?:不存在|无效|未找到)/i.test(errText)) {
        return make("error", "invalid_policy");
      }
      if (/timeout|timed out|超时/i.test(errText)) {
        return make("error", "timeout");
      }
      return make("error", "network");
    }

    const code = httpStatus(
      Number.isInteger(response.status) ? response.status : response.statusCode
    );
    if (code === 429) {
      return make("unknown", "rate_limited", null, { httpStatus: 429 });
    }
    if ([301, 302, 303, 307, 308].includes(code)) {
      const loc = headerValue(response.headers, "location");
      if (/google\.[^/]+\/sorry|consent\.(?:youtube|google)\./i.test(loc)) {
        return make("unknown", "challenge", null, { httpStatus: code });
      }
      return make("unknown", "redirect", null, { httpStatus: code });
    }
    if (code !== 200) {
      return make("unknown", "http", null, { httpStatus: code });
    }

    const html = response.data;
    if (typeof html !== "string" || !html.length || html.length > MAX_HTML) {
      return make("unknown", "body", null, { httpStatus: 200 });
    }

    const observedRegion = extractRegion(html);
    if (
      /our systems have detected unusual traffic|before you continue to (?:YouTube|Google)|id=["']captcha-form|class=["']g-recaptcha/i.test(
        html
      )
    ) {
      return make("unknown", "challenge", observedRegion, { httpStatus: 200 });
    }

    const data = initialData(html);
    if (!data || !data.contents) {
      return make("unknown", "page_format", observedRegion, { httpStatus: 200 });
    }

    const rows = collectObjects(data.contents);
    if (!rows.length) {
      return make("unknown", "page_format", observedRegion, { httpStatus: 200 });
    }

    const text = rows
      .flatMap(v =>
        ["text", "content", "simpleText", "label"].map(k => (typeof v[k] === "string" ? v[k] : ""))
      )
      .join("\n");

    if (
      /(?:YouTube\s+)?Premium\s+(?:is\s+)?(?:not(?:\s+yet)?\s+available|unavailable)\s+in\s+your\s+(?:country|region)/i.test(
        text
      )
    ) {
      return make("unavailable", "region_unavailable", observedRegion, { httpStatus: 200 });
    }

    if (/(?:couldn[’']t|cannot|can[’']t)\s+verify\s+your\s+country/i.test(text)) {
      return make("unknown", "country_unverified", observedRegion, { httpStatus: 200 });
    }

    if (!observedRegion) {
      return make("unknown", "region_unknown", null, { httpStatus: 200 });
    }

    // Inspect structured plan cards first (Individual / Family / Student / Premium Lite).
    let individualOffer = null;
    let firstFullOffer = null;
    let firstLiteOffer = null;

    for (const node of rows) {
      if (node.lpOfferCardViewModel && typeof node.lpOfferCardViewModel === "object") {
        const card = node.lpOfferCardViewModel;
        const cardTitle =
          card.title && typeof card.title.content === "string" ? card.title.content.trim() : "";
        const isIndividual = /^individual$/i.test(cardTitle);
        const options = Array.isArray(card.offerOptions) ? card.offerOptions : [];
        for (const item of options) {
          const parsed = inspectOption(item && item.lpOfferCardOptionViewModel);
          if (!parsed) continue;
          if (parsed.kind === "full") {
            if (!firstFullOffer || (parsed.monthly && !firstFullOffer.monthly)) {
              firstFullOffer = parsed;
            }
            if (isIndividual && (!individualOffer || (parsed.monthly && !individualOffer.monthly))) {
              individualOffer = parsed;
            }
          } else if (parsed.kind === "lite" && !firstLiteOffer) {
            firstLiteOffer = parsed;
          }
        }
      }
      if (node.lpOfferCardOptionViewModel) {
        const parsed = inspectOption(node.lpOfferCardOptionViewModel);
        if (!parsed) continue;
        if (parsed.kind === "full" && !firstFullOffer) {
          firstFullOffer = parsed;
        } else if (parsed.kind === "lite" && !firstLiteOffer) {
          firstLiteOffer = parsed;
        }
      }
    }

    if (individualOffer || firstFullOffer) {
      const chosen = individualOffer || firstFullOffer;
      return make("available", "full_premium_offer", observedRegion, {
        httpStatus: 200,
        price: chosen.price,
        planLabel: individualOffer ? "个人" : null
      });
    }

    if (firstLiteOffer) {
      return make("limited", "lite_only", observedRegion, {
        httpStatus: 200,
        price: firstLiteOffer.price
      });
    }

    return make("unknown", "no_full_premium_offer", observedRegion, { httpStatus: 200 });
  }

  function parseRawModuleArgument(raw) {
    const out = Object.create(null);
    const pattern = /(?:^|&)(_raw|timeout|requestTimeout|price|title|policy[1-4]?|name[1-4]?)=/g;
    const matches = [];
    let m;
    while ((m = pattern.exec(raw)) !== null) {
      const keyStart = m.index + (m[0].startsWith("&") ? 1 : 0);
      matches.push({ key: m[1], valueStart: pattern.lastIndex, keyStart });
    }
    for (let i = 0; i < matches.length; i += 1) {
      const end = i + 1 < matches.length ? matches[i + 1].keyStart - 1 : raw.length;
      out[matches[i].key] = raw.slice(matches[i].valueStart, end);
    }
    return out;
  }

  function parseArguments(rawArgument) {
    const raw = typeof rawArgument === "undefined" || rawArgument === null ? "" : String(rawArgument);
    let settings = Object.create(null);

    if (/(?:^|&)_raw=1(?:&|$)/.test(raw)) {
      settings = parseRawModuleArgument(raw);
    } else if (raw.trim() !== "") {
      for (const pair of raw.split("&")) {
        if (!pair) continue;
        const eq = pair.indexOf("=");
        if (eq < 0) throw new Error("Malformed argument");
        const decode = v => decodeURIComponent(v.replace(/\+/g, " "));
        settings[decode(pair.slice(0, eq))] = decode(pair.slice(eq + 1));
      }
    }

    const title = cleanText(settings.title || "YouTube Premium", 24) || "YouTube Premium";
    const showPrice = !["false", "0", "no", "off"].includes(
      String(settings.price === undefined ? "true" : settings.price)
        .trim()
        .toLowerCase()
    );

    const rawTimeout =
      settings.timeout !== undefined ? settings.timeout : settings.requestTimeout;
    const timeoutNum = rawTimeout === undefined || String(rawTimeout).trim() === "" ? 8 : Number(rawTimeout);
    if (!Number.isFinite(timeoutNum) || timeoutNum < 2 || timeoutNum > 20) {
      throw new Error("Invalid timeout");
    }
    const timeoutSec = Math.round(timeoutNum);

    const normalizePolicy = value => {
      const trimmed = String(value === undefined ? "" : value)
        .replace(/[\r\n\t\u0000-\u001f]/g, " ")
        .trim();
      if (!trimmed || /^(?:auto|rule)$/i.test(trimmed)) return null;
      return trimmed;
    };

    const targets = [];
    const hasIndexed = [1, 2, 3, 4].some(
      i => settings[`policy${i}`] !== undefined || settings[`name${i}`] !== undefined
    );

    if (hasIndexed) {
      for (let i = 1; i <= MAX_POLICIES; i += 1) {
        const pVal = i === 1 ? (settings.policy1 ?? settings.policy) : settings[`policy${i}`];
        const nVal = i === 1 ? (settings.name1 ?? settings.name) : settings[`name${i}`];
        if (pVal === undefined && nVal === undefined) continue;
        const policy = normalizePolicy(pVal);
        const customName = nVal !== undefined && String(nVal).trim() !== "" ? cleanText(nVal, 14) : null;
        const label = customName || cleanText(policy || "未识别节点", 24) || `节点${i}`;
        targets.push({ policy, customName, label });
      }
    } else {
      const rawPolicy = String(settings.policy === undefined ? "" : settings.policy);
      const parts = rawPolicy.includes(",")
        ? rawPolicy
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
        : [rawPolicy];

      if (parts.length > MAX_POLICIES) {
        throw new Error("Too many policies");
      }

      for (const part of parts) {
        const policy = normalizePolicy(part);
        const label = cleanText(policy || "未识别节点", 24) || "未识别节点";
        targets.push({ policy, customName: null, label });
      }
    }

    if (!targets.length) {
      targets.push({ policy: null, customName: null, label: "未识别节点" });
    }

    return { title, showPrice, timeoutSec, targets };
  }

  // Follow select groups and automatic test groups down to the concrete leaf proxy node.
  function unwrapPolicyName(policyName, selectDetails, testResults) {
    if (!policyName || typeof policyName !== "string") return null;
    let current = policyName.trim();
    if (!current) return null;
    const decisions =
      selectDetails && selectDetails.decisions && typeof selectDetails.decisions === "object"
        ? selectDetails.decisions
        : null;
    const results = testResults && typeof testResults === "object" ? testResults : null;
    const visited = new Set();

    for (let hop = 0; hop < 10; hop += 1) {
      if (visited.has(current)) break;
      visited.add(current);
      if (decisions && typeof decisions[current] === "string" && decisions[current].trim()) {
        current = decisions[current].trim();
        continue;
      }
      if (
        results &&
        results[current] &&
        typeof results[current].winner === "string" &&
        results[current].winner.trim()
      ) {
        current = results[current].winner.trim();
        continue;
      }
      break;
    }
    return current;
  }

  function collectGroupMembers(groupName, policyGroups, selectDetails) {
    const members = new Set();
    if (!groupName) return members;
    const queue = [groupName];
    const seenGroups = new Set();
    const groupsMap =
      selectDetails && selectDetails.groups && typeof selectDetails.groups === "object"
        ? selectDetails.groups
        : null;

    while (queue.length && seenGroups.size < 30) {
      const current = queue.shift();
      if (!current || seenGroups.has(current)) continue;
      seenGroups.add(current);
      members.add(current);

      if (policyGroups && Array.isArray(policyGroups[current])) {
        for (const item of policyGroups[current]) {
          const subName = typeof item === "string" ? item : item && item.name;
          if (typeof subName === "string" && subName.trim()) {
            members.add(subName.trim());
            queue.push(subName.trim());
          }
        }
      }
      if (groupsMap && Array.isArray(groupsMap[current])) {
        for (const subName of groupsMap[current]) {
          if (typeof subName === "string" && subName.trim()) {
            members.add(subName.trim());
            queue.push(subName.trim());
          }
        }
      }
    }
    return members;
  }

  function normalizeEpochSeconds(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n > 1e11 ? n / 1000 : n;
  }

  function matchYoutubeRequest(records, startTimeMs, nowMs, targetPolicy, memberSet) {
    if (!Array.isArray(records) || !records.length) return null;
    const minSec = startTimeMs / 1000 - 3;
    const maxSec = nowMs / 1000 + 5;
    let best = null;
    let bestScore = -Infinity;

    for (let idx = 0; idx < records.length; idx += 1) {
      const rec = records[idx];
      if (!rec || typeof rec !== "object") continue;
      const rawUrl = String(rec.URL || rec.url || "");
      if (!/(?:^|https?:\/\/)www\.youtube\.com(?::443|\/|$)/i.test(rawUrl)) continue;
      const policyName = typeof rec.policyName === "string" ? rec.policyName.trim() : "";
      if (!policyName) continue;

      const startSec = normalizeEpochSeconds(rec.startDate);
      const isFresh = startSec === null || (startSec >= minSec && startSec <= maxSec);
      const isRecent = !isFresh && startSec !== null && startSec >= minSec - 60 && startSec <= maxSec;

      let score = isFresh ? 1000 : isRecent ? 600 : 0;
      if (/\/premium(?:\?|$)/i.test(rawUrl)) score += 200;
      if (/script/i.test(String(rec.rule || ""))) score += 40;

      if (targetPolicy) {
        const orig = typeof rec.originalPolicyName === "string" ? rec.originalPolicyName.trim() : "";
        if (policyName === targetPolicy || orig === targetPolicy) {
          score += 300;
        } else if (memberSet && memberSet.has(policyName)) {
          score += 150;
        } else if (isFresh) {
          // Probably belongs to a different policy in multi-policy mode.
          score -= 500;
        }
      }

      if (startSec !== null) score += Math.min(50, Math.max(-50, startSec - minSec));
      if (Number.isInteger(rec.id)) score += Math.min(20, rec.id * 0.0001);
      score -= idx * 0.001;

      if (score > bestScore) {
        bestScore = score;
        best = rec;
      }
    }

    return bestScore >= 500 ? best : null;
  }

  function resolveNodeNames(env, states, startTimeMs, callback) {
    let settled = false;
    const doneOnce = () => {
      if (settled) return;
      settled = true;
      callback();
    };

    let selectDetails = null;
    if (typeof env.selectGroupDetails === "function") {
      try {
        selectDetails = env.selectGroupDetails();
      } catch (_) {}
    }

    // If $httpAPI is unavailable (e.g. minimal unit-test sandbox), unwrap synchronously and finish.
    if (typeof env.httpAPI !== "function") {
      for (const s of states) {
        const leaf = unwrapPolicyName(s.policy, selectDetails, null);
        if (leaf) s.nodeName = cleanText(leaf, 24);
      }
      doneOnce();
      return;
    }

    env.setTimer(doneOnce, NODE_LOOKUP_TIMEOUT_MS);

    const endpoints = [
      "/v1/requests/recent",
      "/v1/requests/active",
      "/v1/policy_groups/test_results",
      "/v1/policy_groups",
      "/v1/outbound"
    ];
    const payloads = Object.create(null);
    let pending = endpoints.length;

    const finishLookup = () => {
      if (settled) return;
      const nowMs = env.now();
      const recentList =
        payloads["/v1/requests/recent"] && Array.isArray(payloads["/v1/requests/recent"].requests)
          ? payloads["/v1/requests/recent"].requests
          : [];
      const activeList =
        payloads["/v1/requests/active"] && Array.isArray(payloads["/v1/requests/active"].requests)
          ? payloads["/v1/requests/active"].requests
          : [];
      const combined = [...activeList, ...recentList];
      const testResults = payloads["/v1/policy_groups/test_results"] || null;
      const policyGroups = payloads["/v1/policy_groups"] || null;
      const outboundMode =
        payloads["/v1/outbound"] && typeof payloads["/v1/outbound"].mode === "string"
          ? payloads["/v1/outbound"].mode
          : null;

      let needGlobalPolicy = false;
      for (const s of states) {
        const members = s.policy ? collectGroupMembers(s.policy, policyGroups, selectDetails) : null;
        const matched = matchYoutubeRequest(combined, startTimeMs, nowMs, s.policy, members);
        if (matched && matched.policyName) {
          const leaf = unwrapPolicyName(matched.policyName, selectDetails, testResults);
          s.nodeName = cleanText(leaf || matched.policyName, 24);
          continue;
        }

        if (s.policy) {
          const leaf = unwrapPolicyName(s.policy, selectDetails, testResults);
          s.nodeName = cleanText(leaf || s.policy, 24);
          continue;
        }

        if (outboundMode === "direct") {
          s.nodeName = "DIRECT";
        } else if (outboundMode === "proxy") {
          needGlobalPolicy = true;
        }
      }

      if (!needGlobalPolicy) {
        doneOnce();
        return;
      }

      try {
        env.httpAPI("GET", "/v1/outbound/global", null, globalRes => {
          const globalPolicy =
            globalRes && typeof globalRes.policy === "string" ? globalRes.policy : null;
          if (globalPolicy) {
            const leaf = unwrapPolicyName(globalPolicy, selectDetails, testResults) || globalPolicy;
            for (const s of states) {
              if (!s.nodeName && !s.policy) {
                s.nodeName = cleanText(leaf, 24);
              }
            }
          }
          doneOnce();
        });
      } catch (_) {
        doneOnce();
      }
    };

    for (const ep of endpoints) {
      try {
        env.httpAPI("GET", ep, null, res => {
          if (res && typeof res === "object") {
            payloads[ep] = res;
          }
          pending -= 1;
          if (pending <= 0) finishLookup();
        });
      } catch (_) {
        pending -= 1;
        if (pending <= 0) finishLookup();
      }
    }
  }

  function renderSingle(cfg, state, nowDate) {
    const result = state.result;
    const displayNode = state.nodeName || state.label || "未识别节点";
    const meta = `节点：${displayNode} · ${state.latencyMs} ms · ${formatTime(nowDate)}`;
    const regionText = result.region ? formatRegion(result.region, false) : null;

    if (result.status === "available") {
      const priceSuffix =
        cfg.showPrice && result.price
          ? ` · ${result.planLabel ? result.planLabel + " " : ""}${result.price}`
          : "";
      return {
        title: `${cfg.title} · 已解锁`,
        content: `地区：${regionText}${priceSuffix}\n${meta}`,
        icon: "play.rectangle.fill",
        "icon-color": "#34C759"
      };
    }

    if (result.status === "unavailable") {
      const line1 = regionText
        ? `地区：${regionText} · 该地区未提供服务`
        : "当前出口所在地区未提供 Premium 服务";
      return {
        title: `${cfg.title} · 未解锁`,
        content: `${line1}\n${meta}`,
        icon: "xmark.rectangle.fill",
        "icon-color": "#FF3B30"
      };
    }

    if (result.status === "limited" && result.reason === "lite_only") {
      const litePrice = cfg.showPrice && result.price ? ` (${result.price})` : "";
      return {
        title: `${cfg.title} · 仅 Lite`,
        content: `地区：${regionText || "未知"} · 仅检测到 Lite${litePrice}\n${meta}`,
        icon: "exclamationmark.triangle.fill",
        "icon-color": "#FF9500"
      };
    }

    if (result.reason === "invalid_policy") {
      return {
        title: `${cfg.title} · 策略异常`,
        content: `未找到策略或节点「${state.policy || state.label}」，请核对模块参数\n更新时间：${formatTime(nowDate)}`,
        icon: "exclamationmark.triangle.fill",
        "icon-color": "#FF9500"
      };
    }

    if (result.reason === "timeout") {
      return {
        title: `${cfg.title} · 请求超时`,
        content: `超过 ${cfg.timeoutSec} 秒未响应，请检查节点或分流策略\n${meta}`,
        icon: "xmark.circle.fill",
        "icon-color": "#FF9500"
      };
    }

    if (result.reason === "network") {
      return {
        title: `${cfg.title} · 连接失败`,
        content: `无法连接 YouTube，请检查代理节点或网络\n${meta}`,
        icon: "xmark.circle.fill",
        "icon-color": "#FF3B30"
      };
    }

    const detailMap = {
      country_unverified: ["国家未验证", "YouTube 无法确认当前出口所属国家/地区"],
      challenge: ["触发验证", "命中 Google 风控或同意页拦截，未确认解锁"],
      rate_limited: ["请求受限", "触发 HTTP 429 限流，请稍后再试"],
      redirect: [
        "重定向异常",
        `收到 HTTP ${result.httpStatus || 302} 跳转，未返回落地页`
      ],
      http: ["响应异常", `返回 HTTP ${result.httpStatus || "异常"}，无法确认状态`],
      body: ["响应异常", "返回页面为空或体积异常，无法确认状态"],
      page_format: ["结构变更", "未能解析页面数据，无法确认解锁状态"],
      region_unknown: ["地区未知", "未能识别唯一的出口地区代码"],
      no_full_premium_offer: [
        "入口未确认",
        regionText
          ? `地区：${regionText} · 未检测到有效购买入口`
          : "未检测到完整 Premium 购买入口"
      ]
    };

    const [badge, line1] = detailMap[result.reason] || ["状态未确认", "暂无法确认解锁情况"];
    return {
      title: `${cfg.title} · ${badge}`,
      content: `${line1}\n${meta}`,
      icon: "exclamationmark.triangle.fill",
      "icon-color": "#FF9500"
    };
  }

  function renderMulti(cfg, items, nowDate) {
    let availableCount = 0;
    let maxSeverity = 0; // 0 = green, 1 = orange, 2 = red

    const lines = items.map(item => {
      const r = item.result;
      const itemLabel = item.customName
        ? item.nodeName && item.nodeName !== item.customName
          ? `${item.customName} (${cleanText(item.nodeName, 14)})`
          : item.customName
        : cleanText(item.nodeName || item.label, 18);

      if (r.status === "available") {
        availableCount += 1;
        const reg = formatRegion(r.region, true);
        const pricePart = cfg.showPrice && r.price ? ` · ${r.price}` : "";
        return `${itemLabel}：已解锁 · ${reg}${pricePart} · ${item.latencyMs}ms`;
      }
      if (r.status === "unavailable") {
        maxSeverity = Math.max(maxSeverity, 2);
        const reg = r.region ? ` · ${formatRegion(r.region, true)}` : "";
        return `${itemLabel}：未解锁${reg} · ${item.latencyMs}ms`;
      }
      if (r.status === "limited") {
        maxSeverity = Math.max(maxSeverity, 1);
        const reg = r.region ? ` · ${formatRegion(r.region, true)}` : "";
        return `${itemLabel}：仅 Lite${reg} · ${item.latencyMs}ms`;
      }
      if (r.reason === "network") {
        maxSeverity = Math.max(maxSeverity, 2);
        return `${itemLabel}：连接失败 (${item.latencyMs}ms)`;
      }
      maxSeverity = Math.max(maxSeverity, 1);
      const shortReason = {
        timeout: `超时 (>${cfg.timeoutSec}s)`,
        invalid_policy: "策略不存在",
        country_unverified: "国家未验证",
        challenge: "触发验证",
        rate_limited: "HTTP 429",
        redirect: `HTTP ${r.httpStatus || 302}`,
        http: `HTTP ${r.httpStatus || "异常"}`
      }[r.reason] || "未确认";
      return `${itemLabel}：${shortReason} (${item.latencyMs}ms)`;
    });

    const color = maxSeverity >= 2 ? "#FF3B30" : maxSeverity === 1 ? "#FF9500" : "#34C759";
    const icon =
      availableCount === items.length
        ? "play.rectangle.fill"
        : availableCount === 0 && maxSeverity >= 2
          ? "xmark.rectangle.fill"
          : "exclamationmark.triangle.fill";

    return {
      title: `${cfg.title} · ${availableCount}/${items.length} 已解锁 · ${formatTime(nowDate)}`,
      content: lines.join("\n"),
      icon,
      "icon-color": color
    };
  }

  function runPanel(env) {
    let finished = false;
    let finalizing = false;
    const finish = payload => {
      if (finished) return;
      finished = true;
      env.done(payload);
    };

    let cfg;
    try {
      cfg = parseArguments(env.argument);
    } catch (_) {
      finish({
        title: "YouTube Premium · 参数异常",
        content: "请检查模块参数：timeout 需为 2–20 秒，最多 4 个对比策略",
        icon: "exclamationmark.triangle.fill",
        "icon-color": "#FF9500"
      });
      return;
    }

    const startTime = env.now();
    const deadlineMs = Math.min(23000, Math.max(4000, cfg.timeoutSec * 1000 + 1500));

    const states = cfg.targets.map(t => ({
      label: t.label,
      customName: t.customName,
      policy: t.policy,
      nodeName: null,
      done: false,
      latencyMs: 0,
      result: null
    }));

    function finalize() {
      if (finished || finalizing) return;
      finalizing = true;
      const nowMs = env.now();
      for (const s of states) {
        if (!s.done) {
          s.done = true;
          s.latencyMs = Math.max(0, nowMs - startTime);
          s.result = classify({ error: "timeout" });
        }
      }
      resolveNodeNames(env, states, startTime, () => {
        const renderDate = env.makeDate(env.now());
        if (states.length === 1) {
          finish(renderSingle(cfg, states[0], renderDate));
        } else {
          finish(renderMulti(cfg, states, renderDate));
        }
      });
    }

    env.setTimer(finalize, deadlineMs);

    let remaining = states.length;
    for (const state of states) {
      const request = {
        url: TARGET_URL,
        timeout: cfg.timeoutSec,
        "auto-redirect": false,
        headers: {
          "User-Agent": UA,
          Accept: "text/html",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Connection: "close"
        }
      };
      if (state.policy) {
        request.policy = state.policy;
      }

      env.httpGet(request, (error, response, data) => {
        if (finished || finalizing || state.done) return;
        state.done = true;
        state.latencyMs = Math.max(1, env.now() - startTime);
        state.result = classify({
          error,
          status: response && response.status,
          statusCode: response && response.statusCode,
          headers: response && response.headers,
          data
        });
        remaining -= 1;
        if (remaining <= 0) {
          finalize();
        }
      });
    }
  }

  const exported = {
    VERSION,
    MAX_HTML,
    TARGET_URL,
    countryFlag,
    formatRegion,
    initialData,
    extractRegion,
    classify,
    parseArguments,
    unwrapPolicyName,
    runPanel
  };

  if (typeof module === "object" && module && module.exports) {
    module.exports = exported;
  } else {
    root.YouTubePremiumPanel = exported;
  }

  if (typeof $done === "function" && typeof $httpClient === "object" && $httpClient) {
    runPanel({
      argument: typeof $argument === "undefined" ? "" : $argument,
      done: $done,
      now: () => Date.now(),
      makeDate: ms => new Date(ms),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      httpGet: (req, cb) => $httpClient.get(req, cb),
      httpAPI:
        typeof $httpAPI === "function"
          ? (method, path, body, cb) => $httpAPI(method, path, body, cb)
          : null,
      selectGroupDetails:
        typeof $surge === "object" && $surge && typeof $surge.selectGroupDetails === "function"
          ? () => $surge.selectGroupDetails()
          : null
    });
  }
})(typeof globalThis === "object" ? globalThis : this);
