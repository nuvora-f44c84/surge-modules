/**
 * 外链中转页 · 自动直跳 (Direct-Link.js)
 *
 * 在 Surge http-request 阶段解析常见网站外链中转页的查询参数，
 * 进行安全的 URL 解码与协议校验后，直接本地返回 HTTP 302 跳转响应，
 * 免去访问中转服务器与手动点击“继续访问”的步骤。
 *
 * 若未提取到合法的 http(s):// 目标地址（例如参数为站内加密 token），
 * 则原样放行请求（$done({})），避免破坏正常打开。
 */
(() => {
  "use strict";

  const HOST_PARAM_MAP = {
    "link.zhihu.com": {
      paths: ["/"],
      keys: ["target"],
    },
    "link.csdn.net": {
      paths: ["/"],
      keys: ["target"],
    },
    "link.juejin.cn": {
      paths: ["/"],
      keys: ["target"],
    },
    "www.jianshu.com": {
      paths: ["/go-wild"],
      keys: ["url"],
    },
    "jianshu.com": {
      paths: ["/go-wild"],
      keys: ["url"],
    },
    "c.pc.qq.com": {
      paths: ["/middlem.html", "/ios.html", "/pc.html", "/index.html"],
      keys: ["pfurl", "url", "tourl"],
    },
    "mail.qq.com": {
      paths: ["/cgi-bin/readtemplate"],
      keys: ["gourl"],
    },
    "weibo.cn": {
      paths: ["/sinaurl"],
      keys: ["u", "toasturl", "url"],
    },
  };

  function safeDecode(raw) {
    if (typeof raw !== "string" || !raw) {
      return "";
    }
    let current = raw.trim();
    for (let i = 0; i < 2; i += 1) {
      if (
        /^https?:\/\//i.test(current) &&
        !/^https?%3A/i.test(current)
      ) {
        break;
      }
      try {
        const next = decodeURIComponent(current);
        if (next === current) {
          break;
        }
        current = next.trim();
      } catch (_) {
        break;
      }
    }
    return current;
  }

  function isValidHttpUrl(candidate) {
    if (typeof candidate !== "string" || !candidate) {
      return false;
    }
    if (/[\r\n\0\t]/.test(candidate)) {
      return false;
    }
    if (!/^https?:\/\/[^\s"'<>]+$/i.test(candidate)) {
      return false;
    }
    try {
      const parsed = new URL(candidate);
      return (
        (parsed.protocol === "http:" || parsed.protocol === "https:") &&
        Boolean(parsed.hostname) &&
        parsed.hostname.includes(".")
      );
    } catch (_) {
      return false;
    }
  }

  function parseQueryParam(queryString, key) {
    if (!queryString) {
      return "";
    }
    const pairs = queryString.split("&");
    for (let i = 0; i < pairs.length; i += 1) {
      const pair = pairs[i];
      if (!pair) {
        continue;
      }
      const eqIdx = pair.indexOf("=");
      if (eqIdx <= 0) {
        continue;
      }
      const rawKey = pair.slice(0, eqIdx);
      if (rawKey === key) {
        return pair.slice(eqIdx + 1);
      }
    }
    return "";
  }

  function resolveRedirectTarget(requestUrl) {
    if (typeof requestUrl !== "string" || !requestUrl) {
      return null;
    }
    let parsed;
    try {
      parsed = new URL(requestUrl);
    } catch (_) {
      return null;
    }

    const host = (parsed.hostname || "").toLowerCase();
    const rule = HOST_PARAM_MAP[host];
    if (!rule) {
      return null;
    }

    const pathname = parsed.pathname || "/";
    const normalizedPath =
      pathname.length > 1 && pathname.endsWith("/")
        ? pathname.slice(0, -1)
        : pathname;
    if (!rule.paths.includes(normalizedPath)) {
      return null;
    }

    const rawQuery = parsed.search ? parsed.search.slice(1) : "";
    if (!rawQuery) {
      return null;
    }

    for (let i = 0; i < rule.keys.length; i += 1) {
      const key = rule.keys[i];
      const rawVal = parseQueryParam(rawQuery, key);
      if (!rawVal) {
        continue;
      }
      const decoded = safeDecode(rawVal);
      if (isValidHttpUrl(decoded)) {
        return decoded;
      }
    }

    return null;
  }

  try {
    const reqUrl =
      typeof $request !== "undefined" && $request && $request.url
        ? $request.url
        : "";
    const target = resolveRedirectTarget(reqUrl);
    if (target) {
      $done({
        response: {
          status: 302,
          headers: {
            Location: target,
            "Cache-Control": "no-store",
          },
          body: "",
        },
      });
      return;
    }
  } catch (_) {
    // 发生任何异常时静默放行原请求
  }

  $done({});
})();
