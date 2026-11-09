# 微信输入法离线阻断规则集

这是 Surge `RULE-SET` 规则集，包含 9 条 `DOMAIN-SUFFIX` / `DOMAIN-KEYWORD` 规则，用于在开启第三方键盘系统权限（如保留按键触感反馈）的场景下，阻断微信输入法（WeType）的云端接口、更新检查及通用埋点统计请求。它不是 `.sgmodule` 模块，不需要 MITM 或脚本。

## 引用

固定地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/WeType-Reject.list
```

镜像地址（国内网络拉取 GitHub Raw 不畅时可选用）：

```text
https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/WeType-Reject.list
```

在主配置的 `[Rule]` 中添加以下一行：

```ini
RULE-SET,https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/WeType-Reject.list,REJECT,extended-matching
```

如需静默丢弃数据包（不返回连接重置），也可将策略由 `REJECT` 改为 `REJECT-DROP`；注意通用统计域名（如 `beacon.qq.com`）在部分内嵌网页中被同步加载时，`REJECT` 立即失败通常比静默超时更不易造成页面等待。

## 规则顺序与客户端配合（重要）

1. **必须放在所有 `qq.com`、`weixin.qq.com` 及国内直连（`CN` / `FINAL`）规则之前。**
   本列表中的域名主要位于 `qq.com` 体系下；若排在腾讯或国内泛直连规则之后，请求会提前命中直连而使阻断失效。建议与主配置顶部的其他去广告/拒绝规则集放在一起。
2. **建议保留 `extended-matching`。**
   开启后 Surge 会同时匹配 HTTP `Host` 与 TLS 握手阶段的 `SNI`，即便客户端绕过系统 DNS 直接向目标 IP 发起连接，只要携带上述主机名仍会被拦截。
3. **配合客户端内隐私设置使用。**
   建议在微信输入法设置中保持关闭「拼写 Plus」、云端词库同步等联网功能，从源头减少后台发包与重试。

## 范围与限制

- **输入法专属域**：覆盖 `wetype.weixin.qq.com`、`wetype.wxqcloud.qq.com`、`z.weixin.qq.com`、`ime.weixin.qq.com` 四个后缀，并以 `DOMAIN-KEYWORD,wetype`、`DOMAIN-KEYWORD,wxime` 兜底同类新增子域。启用后，云端联想、跨设备剪贴板/词库同步、在线语音转文字及应用内检查更新将不可用（仍可通过 App Store 更新应用本体）。
- **通用统计与崩溃上报 SDK**：包含腾讯灯塔（`beacon.qq.com`）、Bugly（`bugly.qq.com`）及链路追踪（`trace.qq.com`），会同时拦截其他集成了上述 SDK 的应用上报，不影响微信正常收发消息、朋友圈与支付。
- **刻意排除的范围**：
  - 不整域拦截 `weixin.qq.com`、`qq.com`、`myqcloud.com`、`servicewechat.com`，避免影响微信核心通信与小程序。
  - 不包含 `tpstelemetry.tencent.com`（腾讯游戏安全与反作弊遥测），避免引发部分腾讯系手游连接报错。
  - 不使用宽泛的 `DOMAIN-KEYWORD,ime`，避免误伤 `time.apple.com` 等含 `ime` 字母组合的正常系统服务。
- **平台边界**：iOS 网络扩展无法按进程名区分流量来源；若客户端后续版本复用微信核心通信主域或采用不携带 SNI 的纯 IP 私有协议通信，纯域名规则集无法单独识别和阻断。

## 验证

外部资源下载就绪后，可在 Surge 规则匹配工具或「最近请求」中核对 `wetype.weixin.qq.com`、`z.weixin.qq.com` 命中拒绝策略，同时确认微信消息收发及系统对时（`time.apple.com`）正常。仓库内清单格式与安全边界检查：

```sh
python3 tests/test_wetype_reject.py
```

## 来源

参考公开分流规则库（如 [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) 的 WeType 规则）及客户端公开服务域名特征人工收窄整理。
