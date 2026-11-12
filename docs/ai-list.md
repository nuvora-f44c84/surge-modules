# AI 统一分流规则集（`AI.list`）

将原本分散在多处（`Grok.list`、`Muse.list`、`Sukka ai.conf`、`AI-Supplement.list`、`Sukka apple_intelligence.conf` 及内联规则）的所有海外 AI 与 Apple Intelligence 域名统一收敛为单一 Surge `RULE-SET`，由 GitHub Actions **每日自动巡检上游新增域名**。

## 引用方式

固定远程地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/AI.list
```

在 Surge 主配置的 `[Rule]` 中仅需一行：

```ini
RULE-SET,https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/AI.list,"📟 智能助理",extended-matching
```

## 必须遵守的 3 条分流顺序要求

1. **置于国内 AI 直连（`cn.list`）之后**：确保 DeepSeek、豆包、通义千问、Kimi 等国内模型优先命中直连。
2. **置于 `X.list` 之前**：`AI.list` 包含 `DOMAIN-SUFFIX,grok.x.com`，而 [`rules/X.list`](../rules/X.list) 包含 `DOMAIN-SUFFIX,x.com`；将 `AI.list` 放在 `X.list` 之上，才能保证 `grok.x.com` 进入 `📟 智能助理`，而普通 X 图片视频继续走 `🚀 我的节点`。
3. **置于 `Apple_All_No_Resolve.list` 之前，且绝不混入中文 Siri 核心域名**：
   - `AI.list` 仅纳入 Apple Intelligence 的 PCC 隐私云计算中继（`apple-relay.*`、`cp4.cloudflare.com`）、匿名令牌签发（`mask-api.icloud.com`、`mask.icloud.com`、`mask-h2.icloud.com`）、相册消除模型下载代理（`ss-cleanup-proxy-prod.us-east-1m.app.apple.com`）与地区资格校验（`gspe1-ssl.ls.apple.com`）。
   - 中文 Siri 核心后端（`guzzoni.apple.com`、`siri.apple.com`、`dejavu.apple.com`、`sequoia.apple.com`、`smoot.apple.com`）必须保留在主配置的 `DIRECT` 直连与 `skip-proxy` / `always-real-ip` 中，[`scripts/sync_ai_rules.py`](../scripts/sync_ai_rules.py) 已内置硬性拦截守卫，防止上游误加导致中文 Siri 报“遇到了一点问题”。

## 覆盖分区与每日自动同步

- **覆盖分区**：
  1. `Apple Intelligence (PCC & Geo-Eligibility)`
  2. `OpenAI / ChatGPT / Sora / Codex`（含 `openai.sufy.com`）
  3. `Anthropic / Claude / MCP`
  4. `Google AI / Gemini / AI Studio / Antigravity`（含 NotebookLM、Jules、Cloud Code）
  5. `xAI / Grok`
  6. `Meta AI & Muse`
  7. `AI Coding & Developer Tools`（Cursor、Windsurf、Copilot 等，**已自动剔除 `api.github.com` 误伤规则**，主配置无需再写 `AND/NOT` 嵌套）
  8. `Other AIGC & Model Platforms`
- **每日自动同步**：由 [`.github/workflows/daily-upstream-sync.yml`](../.github/workflows/daily-upstream-sync.yml) 每日北京时间 `11:17` 自动检查 `Sukka ai.conf` 与 `apple_intelligence.conf`（同时检查 `iRingo` 上游 Release），过滤不安全规则并验证测试通过后自动提交更新。
- **历史兼容**：原补充表 [`rules/AI-Supplement.list`](../rules/AI-Supplement.list) 保留原路径不删除，以免旧配置引用报错；新配置统一使用 `rules/AI.list` 即可。
- **上游来源与许可**：基础补充域名整理自 [VPSDance/ai-proxy-rules](https://github.com/VPSDance/ai-proxy-rules)（MIT 许可，见 [`LICENSES/VPSDance-ai-proxy-rules-MIT.txt`](../LICENSES/VPSDance-ai-proxy-rules-MIT.txt)），动态增量同步自 `ruleset.skk.moe`。
