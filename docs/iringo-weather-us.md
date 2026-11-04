# 天气 · 美标 AQI（iRingo）

本模块基于 [NSRingo WeatherKit v3.3.2](https://github.com/NSRingo/WeatherKit/releases/tag/v3.3.2)，默认使用 `WAQI_InstantCast_US` 计算空气质量指数。模块和 JavaScript 都通过远程 URL 下载，无需保存本地模块或脚本。

## 安装

固定远程地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/iRingo-WeatherKit-US.sgmodule
```

1. 在 Surge 的模块页面选择「安装新模块」，粘贴上面的地址。
2. 停用原 ` iRingo: 🌤 WeatherKit`，以及其他 WeatherKit 天气模块和本地空气质量修复模块。
3. 启用 `天气 · 美标 AQI（iRingo）`，保留已有的脚本、重写、MITM 开关与可信证书设置。
4. 重新打开天气 App 并刷新，按下方方法确认生效。

这是完整替换版，不应和原天气模块同时启用。安装后默认参数已是美标，无需另填令牌。若此前使用了自有天气 API、BoxJs 或其他自定义参数，应先核对并迁移这些设置；本模块不会自动读取另一份模块的参数。

上游最低系统要求为 iOS 18、iPadOS 18、macOS 15、watchOS 11 等；详见[上游文档](https://nsringo.github.io/guide/Weather/weather-kit)。模块启用状态按设备分别保存，在一台设备安装不会自动为另一台启用。

## 美标的含义

美标指空气质量的计算口径，使用的仍是查询位置的污染物浓度，不会把天气地点改成美国，也不会把设备或 Apple 账号地区改为美国。

使用上游内置的 `WAQI_InstantCast_US`，对应 EPA-454/B-24-002 的美标 InstantCast；上游说明其臭氧标准来自 WAQI。它是基于当前污染物数据计算的 InstantCast，不能等同于美国官方站点发布的完整时间加权 NowCast。脚本为了适配 WeatherKit 返回 `EPA_NowCast` 标度标识。

美标与欧标阈值不同，同一组污染物读数可能得到不同指数和等级，切换前后的数字不能直接比较。具体计算与可选算法见[官方空气质量算法说明](https://nsringo.github.io/guide/Weather/weather-kit#内置空气质量算法)。

## 设置与规则范围

除默认算法改为美标和模块名称、说明、版本等发布信息外，规则、脚本定义、MITM 范围及其他参数沿用官方 v3.3.2：

- 天气与未来一小时降水默认使用彩云天气；天气预警默认使用和风网页；污染物数据默认由彩云天气补充。
- 原有五条天气脚本仍从 NSRingo 官方版本化发布地址下载；本仓库没有修改或复制运行用 JS。
- MITM 仅追加 `weatherkit.apple.com`，不替换 CA 证书。
- 保留上游自带四条规则：拦截 `weather-analytics-events.apple.com`、`tthr.apple.com`、`tether.edge.apple`，以及 ASN 714 / 6185 的 QUIC 流量。最后一条涉及这些 Apple ASN 上的 QUIC，并非只作用于天气域名；这是原天气模块已有的处理。
- 不定义代理节点、策略组、AI / X 等网站分流、DNS 或 Tailscale 设置。

模块替换可能改变规则在其他模块之间的排列，迁移后应核对生效规则和已有分流。仅发布本文件不会改变任何设备配置。

配置优先级默认 `Storage=Argument`，优先使用本模块参数；未提供的设置仍可能读取 BoxJs。自有 Token 只在设备参数中填写，不应提交到仓库。

## 验证

当前为 **0.1.0 测试版**：已做 Surge 原生配置语法检查、与官方模块的规则/脚本/参数差异检查，以及官方美标算法离线验证；此远程模块安装后的完整实机流程仍需确认。

安装后检查：

1. 模块参数 `AirQuality.Calculate.Algorithm` 为 `WAQI_InstantCast_US`。
2. 实际天气请求命中本模块的 `🌤 WeatherKit.api.v2.weather.response`，脚本正常完成。
3. 返回的空气质量标度为 `EPA_NowCast`；以同一响应中的污染物浓度计算，可得到相符的指数、等级与首要污染物。
4. 停用其他 WeatherKit 实现，避免先命中旧脚本。只看到模块已开启，并不能证明某次天气请求执行了它。

美标算法包含 CO，正常 CO 数据不会触发欧标下的 `-1` 等级查询问题。官方脚本仍可能记录“多个同级别的污染物”等普通警告；这类日志不代表计算失败。本模块保留上游 `WARN` 日志级别，不全局屏蔽错误或警告。

## 更新与回退

远程模块地址固定，后续在 Surge 中更新该模块即可。当前脚本固定引用官方 v3.3.2，以保持经过检查的接口和参数一致；上游发布新版本后需复核并更新这里的引用。

回退时停用本模块，再启用原天气模块。不要同时开启两套天气脚本。需要调整原版参数时，可直接使用[官方远程模块](https://github.com/NSRingo/WeatherKit/releases/latest/download/iRingo.WeatherKit.sgmodule)。

## 来源与许可

- [NSRingo WeatherKit](https://github.com/NSRingo/WeatherKit)
- [v3.3.2 官方 Surge 模块](https://github.com/NSRingo/WeatherKit/releases/download/v3.3.2/iRingo.WeatherKit.sgmodule)
- [AirQuality 源码](https://github.com/NSRingo/WeatherKit/blob/v3.3.2/src/class/AirQuality.mjs)
- [Surge 模块机制](https://manual.nssurge.com/profile/module.html)
- [Surge 脚本匹配顺序](https://manual.nssurge.com/scripting/overview.html)

上游作者署名保留于模块头部。修改部分为模块发布信息与默认空气质量算法，遵循 Apache-2.0；完整许可证见 [LICENSES/Apache-2.0.txt](../LICENSES/Apache-2.0.txt)。
