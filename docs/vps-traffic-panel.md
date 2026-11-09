# VPS 简洁流量面板

远程通用脚本（`v0.2.0`），支持**单节点模式**与**多节点合并模式（二合一 / 多合一）**，显示流量用量、各监控接口请求延时和距离重置日的天数。它不增加分流规则，不修改策略组，也不提供监控后端。监控地址和其他参数由使用者填写在本机配置中，公开脚本不含私人接口地址或凭据。

固定脚本地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/VPS-TrafficPanel.js
```

## 引用方法

### 1. 二合一合并面板（推荐，节省面板空间）

在单张面板卡片上并发请求两台（或最多 6 台）VPS 的状态接口，各自独立指定请求策略、超时与月重置日：

```ini
[Script]
vps-combined-stats = type=generic,timeout=8,script-path=https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/VPS-TrafficPanel.js,argument="name1=VPS-A&url1=https%3A%2F%2Fa.example.invalid%2Fstatus&quota1=1000&resetDay1=11&policy1=DIRECT&requestTimeout1=3&name2=VPS-B&url2=https%3A%2F%2Fb.example.invalid%2Fstatus&quota2=1000&resetDay2=29&policy2=Example%20Proxy&requestTimeout2=5"

[Panel]
VPS监控 = script-name=vps-combined-stats,title=VPS-A -- · VPS-B --,content=正在读取流量状态...,update-interval=600
```

成功后的两行展示效果：
- **标题**：`VPS-A 145ms · VPS-B 210ms`
- **正文**：
  ```text
  VPS-A：12.50/1000 GB · 2 天重置
  VPS-B：48.20/1000 GB · 20 天重置
  ```
- 若其中一台超时或离线，另一台已返回的真实流量数据仍会正常显示，图标自动切换为告警标志并根据最高严重等级着色。

### 2. 单节点独立面板（向后兼容 v0.1.0）

```ini
[Script]
example-vps-panel = type=generic,timeout=8,script-path=https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/VPS-TrafficPanel.js,argument="name=Example%20VPS&url=https%3A%2F%2Fstats.example.invalid%2Fstatus&quota=500&resetDay=1&policy=DIRECT&requestTimeout=3"

[Panel]
Example VPS = script-name=example-vps-panel,title=Example VPS,content=流量 --/-- GB · -- 天重置,update-interval=600
```

## 参数

`argument` 使用 `key=value&key=value` 格式，每个值必须单独 URL 编码；尤其是监控地址中的 `&`、`+`、`=` 和中文/Emoji 策略名。多节点模式在键名后追加序号 `1`、`2`（直至 `6`）。

| 单节点参数 | 多节点参数（`N=1..6`） | 默认值 | 用途 |
| --- | --- | --- | --- |
| `url` | `url1`、`url2` ... | 无，必填 | 返回 JSON 的 HTTP(S) 监控地址 |
| `name` | `name1`、`name2` ... | VPS / VPS`N` | 面板中显示的节点简称 |
| `quota` | `quota1`、`quota2` ... | 1000 | 后端缺少有效 `quota_gb` 时使用的配额（GB） |
| `resetDay` | `resetDay1`、`resetDay2` ... | 1 | 月重置日，1–31，按 UTC 日期计算 |
| `policy` | `policy1`、`policy2` ... | DIRECT | 仅此监控请求使用的已有 Surge 策略或策略组 |
| `requestTimeout` | `requestTimeout1`、`requestTimeout2` ... | 3 | HTTP 请求超时（秒） |

面板总截止时间自动设为 `max(4000ms, 最大 requestTimeout * 1000 + 1000ms)`（请在 `[Script]` 行配置足够的 `timeout=8`）。

## 后端与显示口径

接口响应示例（虚构数据）：

```json
{"used_gb": 12.5, "quota_gb": 500}
```

流量达到配额的 80% 显示橙色，95% 显示红色。连接异常提示不输出监控地址或查询串令牌。

## 验证

```sh
node --check scripts/VPS-TrafficPanel.js
node --test tests/vps-traffic-panel.test.cjs
```
