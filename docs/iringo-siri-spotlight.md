# Siri 与聚焦搜索（iRingo）

基于 NSRingo Siri v4.2.7 官方版本化远程脚本，解锁 iOS / macOS 聚焦搜索（Spotlight）实时联网建议、选中文字后的“查询（Look Up）”知识卡片（维基百科、影视、词典、App Store 卡片）、Safari 搜索建议及视觉智能查询，同时默认保留中文 Siri 交互体验。

## 安装

固定远程地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/iRingo-Siri-Spotlight.sgmodule
```

在 Surge 模块页面从该地址安装并启用；若此前安装过 `iRingo.Siri.sgmodule`、`iRingo.Spotlight.sgmodule` 或 `iRingo.Search.sgmodule`，请先停用旧模块以避免重复执行脚本。需要开启脚本、MITM，并已安装与信任 Surge CA 证书。

## 相对上游模板的优化

1. **默认中文交互 + 美区知识卡片**：
   - 上游 `iRingo.Siri.sgmodule` 将 `SiriLocale` 默认设为 `AUTO`（跟随 `CountryCode:US` 变为 `en_US`，导致中文语音/文字问答被改写为英文区域）。
   - 本模块默认设定 `CountryCode:US`、`SiriLocale:zh_CN`、`SiriResponseLanguageVariant:zh_CN`，既解锁 `US` 区的 Spotlight / Look Up / Wikipedia 知识卡片，又保持中文搜索与中文 Siri 响应。若偏好繁体中文卡片或新加坡华语区，可在模块参数中将 `CountryCode` 改为 `SG`、`TW` 或 `HK`。
2. **移除上游残留的 `debug=1` 标记**：
   - 上游 `v4.2.7` 的 `iRingo.Siri.sgmodule` 模板在 6 条 `binary-body-mode=1` 的 Parsec 请求脚本上遗留了 `debug=1` 参数；本模块已全部移除，避免不必要的脚本调试开销。
3. **合并新旧接口覆盖**：
   - 同时覆盖 iOS 18+ / macOS 15+ 的 Parsec gRPC-Web 接口（`SiriSearch`、`SafariSearch`、`LookupSearch`、`VisualSearch`、`EngagementSearch`、`ZkwSuggestService`）以及 `/bag`、`/search`、`/card`、`/flight` 接口，单模块同时适配 iPhone 与 Mac。

## 参数说明

- `CountryCode`：目标国家或地区代码，默认 `US`。
- `SiriLocale`：Siri 语言与区域标识，默认 `zh_CN`。
- `Region`：是否强制覆盖与区域关联的设置，默认 `OFF`。
- `SiriResponseLanguageVariant`：Siri 首选响应语言，默认 `zh_CN`。
- `Domains` / `Functions`：启用的搜索领域与功能集合（含 `lookup`、`spotlight`、`safari`、`visualintelligence`、`flightutilities` 等）。
- `LogLevel`：默认 `WARN`。

## 限制与回退

- 本模块仅改写 `api*.smoot.apple.com` / `api.smoot.apple.cn` 的搜索、配置包与知识卡片接口，**不等同于解锁国行硬件的 Apple Intelligence 端侧模型限制**。
- 若遇到聚焦搜索无响应或某项查询卡片异常，可在 Surge 模块页面停用本模块立即恢复系统默认行为。

## 来源与许可

- [NSRingo/Siri](https://github.com/NSRingo/Siri)（[v4.2.7 Release](https://github.com/NSRingo/Siri/releases/tag/v4.2.7)）
- 保留上游作者署名，遵循 [Apache-2.0](../LICENSES/Apache-2.0.txt)。`0.1.1` 将未修改的官方 `v4.2.7` 发布构建托管于本仓库 [`scripts/iringo/`](../scripts/iringo/) 并通过 `raw.githubusercontent.com` 直供，规避 `github.com/.../releases/download/...` 出现 `HTTP 504` 超时导致模块无法安装的问题。
