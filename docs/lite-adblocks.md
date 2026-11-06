# 咪咕视频与航旅纵横去广告

两个独立模块远程路径固定，后续可直接在 Surge 中更新；无需填写账号、密码或后台地址。咪咕视频模块为 **0.1.0 测试版**，航旅纵横模块为 **0.2.0 测试版**。

## 安装和迁移

| 模块 | GitHub 原始文件 | 镜像下载 |
| --- | --- | --- |
| 咪咕视频 · 广告域名补充 | [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/MiguVideo-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/MiguVideo-AdBlock-Lite.sgmodule) |
| 航旅纵横 · 去广告 | [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Umetrip-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Umetrip-AdBlock-Lite.sgmodule) |

在 Surge 的「模块 → 安装新模块」中粘贴上述模块地址。已安装 `0.1.0` 的设备可直接在 Surge 模块页面更新同一模块；已有同名本地模块时，先停用旧本地模块，再启用远程版本，避免同时运行两份规则。发布到仓库不会自动更改设备上的配置或模块开关。

咪咕模块不依赖脚本或 MITM。航旅纵横 `0.2.0` 需要开启重写、脚本、MITM 并信任 Surge 证书；模块直接引用上游 `xingjiu29/Umetrip` 的 `main` 分支远程脚本，无需另放本地文件。脚本更新需在 Surge 中执行外部资源更新。

## 咪咕视频的范围与限制

精确拦截 `ggc.cmvideo.cn`、`ggv.cmvideo.cn`、`ggic03.miguvideo.com`、`ggmk.miguvideo.com`、`ggadoffline.miguvideo.com` 和 `ggx05.miguvideo.com` 六个域名，不使用根域名或通配符拦截。

前五个域名来自上游公开规则。`ggx05.miguvideo.com` 保留为实验候选：上游对 `ggx` 系列采用 `/request/sdk` 路径规则，不能据此保证整个域名仅承载广告。出现加载或播放异常时停用本模块。

此模块是域名拦截补充，不保证去除所有开屏、品牌画面、倒计时、播放前广告或信息流推广，也不改变会员权限。

## 航旅纵横的范围与限制

- 精确拦截 `sensors.umetrip.com.cn`、`analytics.umetrip.com` 两个统计域名。
- 拒绝 `discardrp.umetrip.com`、`startup.umetrip.com` 的 `/gateway/api/umetrip/native` 接口。
- 对 `oss.umetrip.com/fs/advert/polite` 及其子路径返回空 JSON 对象 `{}`（替代 Loon 的 `reject-dict`）。
- 对 `bkclient`、`umerp`、`home`、`umehome`、`sns`、`appmsg` 下 `.umetrip.com` 与 `.umetrip.com.cn` 的 `/gateway/api/umetrip/native` 响应，通过 `engine=webview` 和 `binary-body-mode=true`（上限 512 KiB）执行上游远程脚本，解析二进制 Protobuf 响应以精简首页与“我的”页面推广区块。
- MITM 主机仅追加上述 10 个相关子域名。

`engine=webview` 用于在 Surge 中提供上游脚本所需的 `TextDecoder` Web API。运行脚本直接从上游 `main` 分支拉取，内容随上游仓库更新变化；本仓库不复制或修改该远程 JS。旧版 `scripts/Umetrip-AdBlock-Lite.js` 仅作历史路径兼容保留，`0.2.0` 不再调用。当前 App 版本的完整兼容性仍需实机确认，不保证去除所有推广。

## 验证和回退

安装或更新后彻底退出并重开 App，分别检查启动、首页卡片、“我的”页面、航班查询、行程展示及其他常用入口。已有广告缓存可能在后续启动时更新。更新上游脚本后可在 Surge 中更新外部资源。

出现异常时停用对应远程模块；不要同时启用同一 App 的多份过滤模块。发布检查覆盖 Surge 模块语法、规则与重写边界及脚本配置参数，不等同于实机效果验证。

## 上游与许可

- 咪咕视频上游为 [fmz200/wool_scripts](https://github.com/fmz200/wool_scripts) 的 [Quantumult X 规则合集](https://github.com/fmz200/wool_scripts/blob/main/QuantumultX/rewrite/rewrite.snippet)。
- 航旅纵横 `0.2.0` 转换自 [xingjiu29/Umetrip](https://github.com/xingjiu29/Umetrip) 的 [`umetrip.plugin`](https://raw.githubusercontent.com/xingjiu29/Umetrip/refs/heads/main/umetrip.plugin)（上游标注规则参考 [zirawell/Ad-Cleaner](https://github.com/zirawell/Ad-Cleaner)），远程响应脚本直接引用 [`umetrip.js`](https://raw.githubusercontent.com/xingjiu29/Umetrip/refs/heads/main/umetrip.js)。

本仓库将上述规则与插件配置适配为 Surge 模块格式。两个 `.sgmodule` 配置文件及保留的历史兼容脚本 `scripts/Umetrip-AdBlock-Lite.js` 按 **GPL-3.0-only** 分发；许可全文见 [GPL-3.0](../LICENSES/GPL-3.0.txt)。该许可声明仅覆盖本仓库内的上述文件，不包含远程引用的第三方运行脚本，也不改变其他独立模块的许可。
