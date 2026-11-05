// VPS traffic panel v0.1.0. Private endpoints belong in the local argument.
// Arguments: name, url, quota, resetDay, policy, requestTimeout.
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
    finish({ title: "VPS · 参数异常", content: "请检查面板参数的 URL 编码", icon: "exclamationmark.triangle", "icon-color": "#FF9500" });
    return;
  }

  const name = settings.name || "VPS";
  const apiUrl = settings.url || "";
  const quotaDefault = Number(settings.quota === undefined ? 1000 : settings.quota);
  const billingDay = Number(settings.resetDay === undefined ? 1 : settings.resetDay);
  const requestTimeout = Number(settings.requestTimeout === undefined ? 3 : settings.requestTimeout);
  const policy = settings.policy || "DIRECT";
  const offline = (title, content, color = "#FF3B30") => finish({
    title, content, icon: "xmark.circle.fill", "icon-color": color
  });
  if (!/^https?:\/\/[^\s]+$/i.test(apiUrl) || !Number.isFinite(quotaDefault) || quotaDefault < 0
      || !Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31
      || !Number.isFinite(requestTimeout) || requestTimeout <= 0) {
    offline(`${name} · 参数异常`, "请填写有效的监控地址、流量配额和重置日", "#FF9500");
    return;
  }

  const startTime = Date.now();
  setTimeout(() => offline(`${name} · 请求超时`, "4 秒内没有返回\n请检查监控接口与请求策略", "#FF9500"), 4000);

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function daysUntilBillingReset() {
    const now = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), billingDay));
    if (now.getUTCDate() >= billingDay) next.setUTCMonth(next.getUTCMonth() + 1);
    return Math.max(0, Math.ceil((next - now) / 86400000));
  }

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
    const percent = quota > 0 ? used / quota * 100 : 0;
    const color = percent >= 95 ? "#FF3B30" : percent >= 80 ? "#FF9500" : "#34C759";
    finish({
      title: `${name} · ${latency} ms`,
      content: `流量 ${used.toFixed(2)}/${quota.toFixed(0)} GB · ${daysUntilBillingReset()} 天重置`,
      icon: "server.rack",
      "icon-color": color
    });
  });
})();
