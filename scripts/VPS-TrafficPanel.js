// VPS traffic panel v0.2.0. Private endpoints belong in the local argument.
// Supports both single-node (name, url, quota, resetDay, policy, requestTimeout)
// and multi-node 2-in-1 / N-in-1 mode (name1/url1/... or name/url/... + name2/url2/...).
(() => {
  let finished = false;
  const finish = payload => {
    if (finished) return;
    finished = true;
    $done(payload);
  };

  const settings = Object.create(null);
  try {
    const argument = typeof $argument === "undefined" ? "" : String($argument);
    for (const pair of argument.split("&")) {
      if (!pair) continue;
      const separator = pair.indexOf("=");
      if (separator < 0) throw new Error("Missing argument value");
      const decode = value => decodeURIComponent(value.replace(/\+/g, " "));
      settings[decode(pair.slice(0, separator))] = decode(pair.slice(separator + 1));
    }
  } catch (_) {
    finish({
      title: "VPS · 参数异常",
      content: "请检查面板参数的 URL 编码",
      icon: "exclamationmark.triangle",
      "icon-color": "#FF9500"
    });
    return;
  }

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function daysUntilBillingReset(billingDay) {
    const now = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), billingDay));
    if (now.getUTCDate() >= billingDay) next.setUTCMonth(next.getUTCMonth() + 1);
    return Math.max(0, Math.ceil((next - now) / 86400000));
  }

  function isValidNodeConfig(cfg) {
    return (
      /^https?:\/\/[^\s]+$/i.test(cfg.apiUrl) &&
      Number.isFinite(cfg.quotaDefault) &&
      cfg.quotaDefault >= 0 &&
      Number.isInteger(cfg.billingDay) &&
      cfg.billingDay >= 1 &&
      cfg.billingDay <= 31 &&
      Number.isFinite(cfg.requestTimeout) &&
      cfg.requestTimeout > 0
    );
  }

  const hasIndexedNodes =
    settings.url1 !== undefined ||
    settings.url2 !== undefined ||
    settings.name2 !== undefined;

  // --- Single-node mode (100% backward-compatible with v0.1.0) ---
  if (!hasIndexedNodes) {
    const name = settings.name || "VPS";
    const apiUrl = settings.url || "";
    const quotaDefault = Number(settings.quota === undefined ? 1000 : settings.quota);
    const billingDay = Number(settings.resetDay === undefined ? 1 : settings.resetDay);
    const requestTimeout = Number(settings.requestTimeout === undefined ? 3 : settings.requestTimeout);
    const policy = settings.policy || "DIRECT";
    const offline = (title, content, color = "#FF3B30") =>
      finish({
        title,
        content,
        icon: "xmark.circle.fill",
        "icon-color": color
      });

    if (!isValidNodeConfig({ apiUrl, quotaDefault, billingDay, requestTimeout })) {
      offline(`${name} · 参数异常`, "请填写有效的监控地址、流量配额和重置日", "#FF9500");
      return;
    }

    const startTime = Date.now();
    const deadlineMs = requestTimeout > 3 ? Math.ceil(requestTimeout * 1000) + 1000 : 4000;
    setTimeout(
      () => offline(`${name} · 请求超时`, `${Math.round(deadlineMs / 1000)} 秒内没有返回\n请检查监控接口与请求策略`, "#FF9500"),
      deadlineMs
    );

    $httpClient.get({ url: apiUrl, timeout: requestTimeout, policy }, (error, response, data) => {
      if (finished) return;
      const latency = Date.now() - startTime;
      if (error || !data) {
        offline(`${name} · 离线`, `连接失败: ${latency}ms\n请检查监控接口与请求策略`);
        return;
      }
      let stats;
      try {
        stats = JSON.parse(data);
        if (!stats || typeof stats !== "object") throw new Error("Invalid response");
      } catch (_) {
        offline(`${name} · 数据异常`, `返回不是有效 JSON 对象: ${latency}ms`, "#FF9500");
        return;
      }
      if (stats.error) {
        offline(`${name} · 采集异常`, `${stats.error}\n延迟: ${latency}ms`, "#FF9500");
        return;
      }
      const quota = toNumber(stats.quota_gb, quotaDefault);
      const used = toNumber(stats.used_gb);
      const percent = quota > 0 ? (used / quota) * 100 : 0;
      const color = percent >= 95 ? "#FF3B30" : percent >= 80 ? "#FF9500" : "#34C759";
      finish({
        title: `${name} · ${latency} ms`,
        content: `流量 ${used.toFixed(2)}/${quota.toFixed(0)} GB · ${daysUntilBillingReset(billingDay)} 天重置`,
        icon: "server.rack",
        "icon-color": color
      });
    });
    return;
  }

  // --- Multi-node combined panel mode (2-in-1 / N-in-1) ---
  const nodes = [];
  for (let idx = 1; idx <= 6; idx += 1) {
    const rawUrl = idx === 1 ? (settings.url1 ?? settings.url) : settings[`url${idx}`];
    const rawName = idx === 1 ? (settings.name1 ?? settings.name) : settings[`name${idx}`];
    if (rawUrl === undefined && rawName === undefined) {
      if (idx >= 2) continue;
    }
    const name = rawName || `VPS${idx}`;
    const apiUrl = rawUrl || "";
    const rawQuota = idx === 1 ? (settings.quota1 ?? settings.quota) : settings[`quota${idx}`];
    const rawReset = idx === 1 ? (settings.resetDay1 ?? settings.resetDay) : settings[`resetDay${idx}`];
    const rawTimeout =
      idx === 1
        ? (settings.requestTimeout1 ?? settings.requestTimeout)
        : settings[`requestTimeout${idx}`];
    const rawPolicy = idx === 1 ? (settings.policy1 ?? settings.policy) : settings[`policy${idx}`];

    nodes.push({
      name,
      apiUrl,
      quotaDefault: Number(rawQuota === undefined ? 1000 : rawQuota),
      billingDay: Number(rawReset === undefined ? 1 : rawReset),
      requestTimeout: Number(rawTimeout === undefined ? 3 : rawTimeout),
      policy: rawPolicy || "DIRECT",
      done: false,
      state: "pending",
      severity: 0, // 0=green, 1=orange, 2=red
      titlePart: `${name} --`,
      contentLine: `${name}：等待响应`
    });
  }

  if (nodes.length === 0 || !nodes.every(isValidNodeConfig)) {
    finish({
      title: "VPS · 参数异常",
      content: "请检查各节点的监控地址、流量配额和重置日",
      icon: "xmark.circle.fill",
      "icon-color": "#FF9500"
    });
    return;
  }

  const maxTimeoutSec = Math.max(...nodes.map(n => n.requestTimeout));
  const deadlineMs = Math.max(4000, Math.ceil(maxTimeoutSec * 1000) + 1000);
  const startTime = Date.now();

  function finalizeCombined() {
    if (finished) return;
    for (const n of nodes) {
      if (!n.done) {
        n.done = true;
        n.state = "timeout";
        n.severity = 1;
        n.titlePart = `${n.name} 超时`;
        n.contentLine = `${n.name}：请求超时（>${Math.round(deadlineMs / 1000)}s）`;
      }
    }

    const okCount = nodes.filter(n => n.state === "ok").length;
    const maxSeverity = Math.max(...nodes.map(n => n.severity));
    const color = maxSeverity >= 2 ? "#FF3B30" : maxSeverity === 1 ? "#FF9500" : "#34C759";

    let icon = "server.rack";
    if (okCount === 0) {
      icon = "xmark.circle.fill";
    } else if (okCount < nodes.length) {
      icon = "exclamationmark.triangle.fill";
    }

    finish({
      title: nodes.map(n => n.titlePart).join(" · "),
      content: nodes.map(n => n.contentLine).join("\n"),
      icon,
      "icon-color": color
    });
  }

  setTimeout(finalizeCombined, deadlineMs);

  let remaining = nodes.length;
  for (const node of nodes) {
    $httpClient.get(
      { url: node.apiUrl, timeout: node.requestTimeout, policy: node.policy },
      (error, response, data) => {
        if (finished || node.done) return;
        node.done = true;
        const latency = Date.now() - startTime;

        if (error || !data) {
          node.state = "offline";
          node.severity = 2;
          node.titlePart = `${node.name} 离线`;
          node.contentLine = `${node.name}：连接失败 (${latency}ms)`;
        } else {
          let stats = null;
          let parseFailed = false;
          try {
            stats = JSON.parse(data);
            if (!stats || typeof stats !== "object") parseFailed = true;
          } catch (_) {
            parseFailed = true;
          }

          if (parseFailed) {
            node.state = "invalid";
            node.severity = 1;
            node.titlePart = `${node.name} 异常`;
            node.contentLine = `${node.name}：数据格式异常 (${latency}ms)`;
          } else if (stats.error) {
            node.state = "collector_error";
            node.severity = 1;
            node.titlePart = `${node.name} 异常`;
            node.contentLine = `${node.name}：${stats.error} (${latency}ms)`;
          } else {
            const quota = toNumber(stats.quota_gb, node.quotaDefault);
            const used = toNumber(stats.used_gb);
            const percent = quota > 0 ? (used / quota) * 100 : 0;
            node.state = "ok";
            node.severity = percent >= 95 ? 2 : percent >= 80 ? 1 : 0;
            node.titlePart = `${node.name} ${latency}ms`;
            node.contentLine = `${node.name}：${used.toFixed(2)}/${quota.toFixed(0)} GB · ${daysUntilBillingReset(node.billingDay)} 天重置`;
          }
        }

        remaining -= 1;
        if (remaining <= 0) {
          finalizeCombined();
        }
      }
    );
  }
})();
