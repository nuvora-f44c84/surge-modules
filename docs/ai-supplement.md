# AI 专用域名补充

这是 Surge `RULE-SET` 规则集，包含 197 条 `DOMAIN` / `DOMAIN-SUFFIX` 规则，用于补充 AI 服务主列表的覆盖范围。它不是 `.sgmodule` 模块，不提供代理节点，也不需要 MITM 或脚本。

## 引用

固定地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/AI-Supplement.list
```

在主配置的 `[Rule]` 中添加以下一行，并将 `AI-Proxy` 替换为已有策略组的名称：

```ini
RULE-SET,https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/AI-Supplement.list,AI-Proxy,extended-matching
```

规则按顺序匹配。若已有局域网和国内 AI 直连规则，应让它们保持在此补充规则之前；该补充可放在 AI 主列表之后、普通海外网站及 FINAL 规则之前。替换既有本地规则集时，仅替换文件路径，保留其位置、策略和匹配选项。

Surge 会下载并缓存远程规则。未指定 `update-interval` 时，默认更新间隔为 24 小时；需要立即取得更新时，可手动更新该外部资源。规则文件由本仓库人工维护，不自动合并上游的新域名。

## 范围与限制

- 当前内容基于 2026-10-19 整理的域名清单，来源为 [VPSDance/ai-proxy-rules](https://github.com/VPSDance/ai-proxy-rules)，经过人工收窄。
- 包含 AI 服务域名和部分服务专用的第三方主机名；不使用进程、IP、ASN 或通用云服务商整域规则。
- `DOMAIN-SUFFIX` 同时覆盖所列域名及其子域名；命中后整个主机的连接采用配置中指定的策略，不能区分同一主机内的 AI 与非 AI 功能。
- 它是补充集，不能单独保证覆盖所有 AI 请求；主列表后续更新后，两份列表可能存在重合。
- `extended-matching` 沿用 Surge 的扩展域名匹配，不代表启用 HTTPS 解密。

## 验证

检查外部资源已下载且就绪，再在 Surge 的规则匹配工具中核对目标域名及策略组。若前置规则已匹配某个域名，它不会继续进入此补充集。修改时核对规则顺序，避免改变国内 AI、局域网或其他网站的既有分流。

上游采用 MIT 许可，版权声明与完整许可见 [VPSDance 许可](../LICENSES/VPSDance-ai-proxy-rules-MIT.txt)。格式、缓存和更新行为见 [Surge 官方规则集文档](https://manual.nssurge.com/rules/ruleset.html)。
