# 定位 · 地区检测（iRingo）

使用 NSRingo LocationServices v1.0.1 官方远程脚本，将 Apple 的 `/pep/gcc` 网络地区检测结果改为指定国家或地区，默认 `US`。模块与脚本均通过 URL 下载。

## 安装

固定远程地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/iRingo-LocationService-US.sgmodule
```

在 Surge 模块页面从这个地址安装，启用 `定位 · 地区检测（iRingo）`，停用旧的 ` iRingo: 📍 Location`、`LocationService（地区修复）` 本地模块及其他处理同一接口的定位模块。地图和天气是独立模块，按原设置保留。

需要开启脚本、MITM，并已安装与信任 Surge 的证书。模块只追加 MITM 主机，不替换证书。各设备的安装和启用状态独立。

## 参数与范围

- `GeoCountryCode`：网络地区检测的目标代码，默认 `US`。
- `LogLevel`：默认 `WARN`。
- 单条分流规则：`DOMAIN,gspe1-ssl.ls.apple.com,DIRECT`。
- 单条响应脚本：仅处理 `gspe1-ssl.ls.apple.com/pep/gcc`，下载官方 v1.0.1 的 `response.bundle.js`。
- MITM 主机：仅追加 `gspe1-ssl.ls.apple.com`。

本版本关闭 `Dispatcher.Hybrid`，未添加高德 Dispatcher 请求处理、地图策略或其他分流。它保留单一网络地区检测功能，不会改变 GPS 坐标、SIM 卡国家代码、Wi-Fi 国家代码或 Apple 账号地区。

根据[上游说明](https://nsringo.github.io/guide/GeoServices/location-service.html)，较新系统会综合多种地区信号，因此这个接口返回 `US` 并不代表所有 Apple 功能均判定为美国地区。功能兼容性仍由各 App 和系统版本决定。

## 验证与维护

当前为 **0.1.0 测试版**。发布前检查模块语法，并核对裁剪范围只有一条规则、一条脚本和一个 MITM 主机；安装后仍应确认实际请求执行的是本模块。

通过启用 Surge 的设备访问 `https://gspe1-ssl.ls.apple.com/pep/gcc`，结果应为设定的两个字母地区代码。结合请求记录检查 `📍 LocationService.pep.gcc.response` 执行完成，可确认改写已应用；单看模块开关不代表某次请求已命中。

从本地版本迁移时，先确认远程版本返回正确，再移除本地文件。模块替换可能改变该域名规则相对其他模块的排列，应同时核对已有规则和策略组。回退时停用本模块，启用此前已验证的定位模块。

安装地址固定；后续通过 Surge 更新模块。运行脚本固定为官方 v1.0.1，升级上游前需复核参数和接口。此文件没有复制或修改上游运行 JS。

## 来源与许可

- [NSRingo LocationServices](https://github.com/NSRingo/LocationServices)
- [v1.0.1 官方模块](https://github.com/NSRingo/LocationServices/releases/download/v1.0.1/iRingo.LocationService.sgmodule)
- [iRingo 定位服务说明](https://nsringo.github.io/guide/GeoServices/location-service.html)
- [Surge 模块机制](https://manual.nssurge.com/profile/module.html)

保留上游作者署名，遵循 [Apache-2.0](../LICENSES/Apache-2.0.txt)。修改范围为模块发布信息，以及仅保留网络地区检测功能的配置裁剪。
