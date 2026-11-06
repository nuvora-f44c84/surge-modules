# 咪咕视频与航旅纵横去广告

两个独立模块远程路径固定，后续可直接在 Surge 中更新；无需填写账号、密码或后台地址。咪咕视频模块为 **0.1.0 测试版**，航旅纵横模块为 **0.2.1 测试版**。

## 安装和迁移

| 模块 | GitHub 原始文件 | 镜像下载 |
| --- | --- | --- |
| 咪咕视频 · 广告域名补充 | [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/MiguVideo-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/MiguVideo-AdBlock-Lite.sgmodule) |
| 航旅纵横 · 去广告 | [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Umetrip-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Umetrip-AdBlock-Lite.sgmodule) |

在 Surge 的「模块 → 安装新模块」中粘贴上述模块地址。已安装旧版的设备可直接在 Surge 模块页面更新同一模块；已有同名本地模块时，先停用旧本地模块，再启用远程版本，避免同时运行两份规则。发布到仓库不会自动更改设备上的配置或模块开关。

咪咕模块不依赖脚本或 MITM。航旅纵横模块需要开启重写、脚本、MITM 并信任 Surge 证书；响应脚本从上游仓库的固定提交下载，无需另放本地文件。

## 咪咕视频的范围与限制

精确拦截 `ggc.cmvideo.cn`、`ggv.cmvideo.cn`、`ggic03.miguvideo.com`、`ggmk.miguvideo.com`、`ggadoffline.miguvideo.com` 和 `ggx05.miguvideo.com` 六个域名，不使用根域名或通配符拦截。

前五个域名来自上游公开规则。`ggx05.miguvideo.com` 保留为实验候选：上游对 `ggx` 系列采用 `/request/sdk` 路径规则，不能据此保证整个域名仅承载广告。出现加载或播放异常时停用本模块。

此模块是域名拦截补充，不保证去除所有开屏、品牌画面、倒计时、播放前广告或信息流推广，也不改变会员权限。

## 航旅纵横的范围与限制

- 精确拦截 `sensors.umetrip.com.cn`、`analytics.umetrip.com` 两个统计域名。
- 拒绝 `discardrp.umetrip.com`、`startup.umetrip.com` 的 `/gateway/api/umetrip/native` 接口。
- 对 `oss.umetrip.com/fs/advert/polite` 及其子路径返回空 JSON 对象 `{}`（对应上游 Loon 的 `reject-dict`）。
- 对 `bkclient`、`umerp`、`home`、`umehome`、`sns`、`appmsg` 下 `.umetrip.com` 与 `.umetrip.com.cn` 的 `/gateway/api/umetrip/native` 响应，以 `binary-body-mode=true`（上限 512 KiB）执行上游脚本，解析二进制 Protobuf 响应，精简首页与“我的”页面推广区块。
- MITM 主机仅追加上述 10 个相关子域名。

模块使用 `engine=webview`，以提供上游脚本用到的 `TextDecoder`。Surge 默认 JSC 环境是否同样提供该接口尚未验证，因此暂不改回 `jsc`。

### 与 0.1.0 的差异

0.1.0 还覆盖上游公开的 HTTP 端点 `114.115.217.129` 的同一接口（按 `rpid` 请求头返回 404）。0.2.x 跟随新上游插件，**不再处理该 IP 端点**。如果 App 仍经由该地址获取广告，相关推广可能不会被过滤。旧脚本 `scripts/Umetrip-AdBlock-Lite.js` 仅为历史路径兼容保留，0.2.x 不再调用。

### 远程脚本的信任范围

该脚本运行在 10 个已解密的主机上，可以读取这些请求的 URL、请求头（可能包含登录凭据）和响应内容；Surge 脚本环境也具备发起网络请求的能力。为避免上游变更直接生效，`script-path` 锁定在完整提交哈希上，不跟随分支：

- 固定提交：[`d794d34b3718c24692befe0f7a4b139a2070aa81`](https://github.com/xingjiu29/Umetrip/tree/d794d34b3718c24692befe0f7a4b139a2070aa81)
- `umetrip.js` SHA-256：`42fdd7b9071b3a561a8a9e31cb3f70b9b1409d953ddbbab393652e4e878a8b7f`

发布前对该版本的人工检查结果：只修改匹配接口的响应体；不调用 `$httpClient`、`$persistentStore` 或其他网络、存储接口；`console.log` 仅输出 `rpid`、响应体字节数、区块数量、group ID 及解析异常信息，不输出请求头或正文内容。

更新上游版本时，先审阅新提交的脚本差异，确认不存在网络请求、持久化或敏感日志，再同时更新模块中的哈希和本节记录。不要改为 `refs/heads/main` 等分支地址。

## 验证和回退

安装或更新后彻底退出并重开 App，分别检查启动、首页卡片、“我的”页面、航班查询、行程展示及其他常用入口。已有广告缓存可能在后续启动时更新。

出现异常时停用对应远程模块；不要同时启用同一 App 的多份过滤模块。`tests/test_umetrip_adblock.py` 只检查模块语法、规则与重写边界、脚本参数、提交锁定及 MITM 主机，不验证上游脚本在 Surge 中的实际运行效果，不能替代实机验证。

## 上游、来源与许可

- 咪咕视频规则来自 [fmz200/wool_scripts](https://github.com/fmz200/wool_scripts) 的 [Quantumult X 规则合集](https://github.com/fmz200/wool_scripts/blob/main/QuantumultX/rewrite/rewrite.snippet)。
- 航旅纵横 0.2.x 是 [xingjiu29/Umetrip](https://github.com/xingjiu29/Umetrip) 中 `umetrip.plugin` 的 Surge 格式转换（上游标注规则参考 [zirawell/Ad-Cleaner](https://github.com/zirawell/Ad-Cleaner)）；响应脚本为该仓库固定提交中未修改的 `umetrip.js`，以远程引用方式使用，本仓库不复制。
- 航旅纵横 0.1.0 的端点与广告标识来自 fmz200/wool_scripts 的[航旅纵横广告脚本](https://github.com/fmz200/wool_scripts/blob/main/Scripts/umetrip/umetrip_ads.js)。

`modules/MiguVideo-AdBlock-Lite.sgmodule` 与 `scripts/Umetrip-AdBlock-Lite.js` 按 **GPL-3.0-only** 分发；许可全文见 [GPL-3.0](../LICENSES/GPL-3.0.txt)。

`xingjiu29/Umetrip` 未声明开源许可，`modules/Umetrip-AdBlock-Lite.sgmodule` 自 0.2.0 起为该上游插件的格式转换，**本仓库不对其声明许可**，相关权利归上游作者所有；远程引用的 `umetrip.js` 同样不在本仓库许可范围内。如上游作者要求，将移除该模块。
