# VPS 简洁流量面板

远程通用脚本，只显示流量用量、监控接口请求延时和距离重置日的天数。它不增加分流规则，不修改策略组，也不提供监控后端。监控地址和其他参数由使用者填写在本机配置中，公开脚本不含私人接口地址或凭据。

固定脚本地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/VPS-TrafficPanel.js
```

## 引用方法

这是 `generic` 面板脚本，在主配置中引用；不需要在模块页面安装。以下地址和数据均为虚构示例，使用前替换成自己的监控接口：

```ini
[Script]
example-vps-panel = type=generic,timeout=8,script-path=https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/VPS-TrafficPanel.js,argument="name=Example%20VPS&url=https%3A%2F%2Fstats.example.invalid%2Fstatus&quota=500&resetDay=1&policy=DIRECT&requestTimeout=3"

[Panel]
Example VPS = script-name=example-vps-panel,title=Example VPS,content=流量 --/-- GB · -- 天重置,update-interval=600
```

多个面板可以引用同一远程脚本，分别设置参数。迁移现有面板时，保留原脚本名称、面板名称和刷新间隔，改写 `script-path` 并提供原有监控地址及策略参数即可。

## 参数

`argument` 使用 `key=value&key=value` 格式，每个值必须单独 URL 编码；尤其是监控地址中的 `&`、`+`、`=` 和中文策略名。不要把包含私人参数的整份主配置上传到公开仓库。

| 参数 | 默认值 | 用途 |
| --- | --- | --- |
| `url` | 无，必填 | 返回 JSON 的 HTTP(S) 监控地址 |
| `name` | VPS | 面板标题中的名称 |
| `quota` | 1000 | 后端缺少有效 `quota_gb` 时使用的配额，单位 GB |
| `resetDay` | 1 | 月重置日，1–31，按 UTC 日期计算 |
| `policy` | DIRECT | 仅此监控请求使用的已有 Surge 策略或策略组 |
| `requestTimeout` | 3 | HTTP 请求超时，单位秒 |

脚本另有固定 4 秒的面板完成期限，超过后显示超时；增大 `requestTimeout` 不会延长此期限。结束后不会重复提交面板结果。

## 后端与显示口径

接口响应示例（虚构数据）：

```json
{"used_gb": 12.5, "quota_gb": 500}
```

成功后显示 `流量 12.50/500 GB · N 天重置`，标题显示此次监控 API 请求耗时。这个耗时包含接口响应和传输，不等于 Surge 节点测速或 ICMP ping。使用量由后端提供，脚本不自行统计进出站，也不改变后端 GB 口径。

重置天数按配置的 UTC 月重置日计算，当天按下一个账期显示，向上取整；29–31 日在短月份采用 JavaScript UTC 日历的溢出行为。该计算不查询服务商账单。流量达到配额的 80% 显示橙色，95% 显示红色。

接口失败、超时、无效 JSON 或后端 `error` 字段会显示异常提示。连接异常提示不输出监控地址；后端返回的错误文字仍会显示，接口不应在错误字段中返回密钥。

## 验证

```sh
node --check scripts/VPS-TrafficPanel.js
node --test tests/vps-traffic-panel.test.cjs
```

测试只使用虚构地址与数据，覆盖参数编码、请求策略、显示结果、重置边界、错误处理和单次完成。运行前确认远程脚本下载就绪，真实监控接口能从指定策略访问。

依据：[Surge generic 脚本](https://manual.nssurge.com/scripting/generic.html)、[脚本 API](https://manual.nssurge.com/scripting/api.html)、[信息面板](https://manual.nssurge.com/tools/panel.html)。
