# TestFlight · 区域与通用应用（iRingo）

基于 NSRingo TestFlight v3.4.0 官方版本化远程脚本，解除 TestFlight 测试版 App 的国家/地区限制（默认改写为 `US`），并开启 `Universal=true` 通用应用支持（允许在 Apple Silicon Mac 或 iPad 上安装未单独开放对应平台限制的 iOS 测试版 App）。

## 安装

固定远程地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/iRingo-TestFlight.sgmodule
```

在 Surge 模块页面从该地址安装并启用；若已安装旧版 `iRingo.TestFlight.sgmodule`，请先停用旧模块。需要开启脚本、MITM，并已安装与信任 Surge CA 证书。

## 参数与范围

- `CountryCode`：目标国家或地区代码，默认 `US`。
- `Universal`：通用应用改写，默认 `true`。
- `MultiAccount`：多账号令牌缓存，默认 `false`（单账号使用更干净，无需向 BoxJs/持久化存储写入账号令牌；若有切换多区 Apple ID 需求可在参数中改为 `true`）。
- `AlwaysShowInstall`：强制显示安装按钮，默认 `false`。
- `MergeNotifications`：合并通知，默认 `false`。
- `LogLevel`：默认 `WARN`。
- `[General]`：将 `iosapps.itunes.apple.com` 追加至 `skip-proxy`，让 TestFlight 安装包本体走本地直连满速下载，不消耗代理节点流量。
- `[MITM]`：仅追加 `testflight.apple.com`。

## 限制与回退

- 本模块仅解除 TestFlight 区域校验与平台安装限制，**不能绕过测试名额已满（Beta is full）或邀请码失效**。
- 若启用后 TestFlight 列表加载异常，可在 Surge 模块页面停用本模块立即恢复。

## 来源与许可

- [NSRingo/TestFlight](https://github.com/NSRingo/TestFlight)（[v3.4.0 Release](https://github.com/NSRingo/TestFlight/releases/tag/v3.4.0)）
- 保留上游作者署名，遵循 [Apache-2.0](../LICENSES/Apache-2.0.txt)。`0.1.1` 将未修改的官方 `v3.4.0` 发布构建托管于本仓库 [`scripts/iringo/`](../scripts/iringo/) 并通过 `raw.githubusercontent.com` 直供，规避 `github.com/.../releases/download/...` 出现 `HTTP 504` 超时导致模块无法安装的问题。
