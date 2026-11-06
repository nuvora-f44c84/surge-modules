# 直播吧 · 广告域名补充

**0.1.1 测试版。** 纯域名/IP 拦截模块，无需 MITM、重写或脚本，无需填写参数。

## 安装

| GitHub 原始文件 | 镜像下载 |
| --- | --- |
| [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Zhibo8-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Zhibo8-AdBlock-Lite.sgmodule) |

在 Surge 的「模块 → 安装新模块」中粘贴上述地址。如果主配置 `[Rule]` 中已有相同的手写规则，启用本模块后删除那几行，否则停用模块时主配置里的规则仍会继续拦截。发布到仓库不会自动修改设备上的配置。

## 范围

| 规则 | 类别 | 说明 |
| --- | --- | --- |
| `DOMAIN-SUFFIX,ggck.qiumibao.com` | 直播吧 | 广告（按域名推断） |
| `DOMAIN-SUFFIX,tongji.qiumibao.com` | 直播吧 | 统计（按域名推断） |
| `IP-CIDR,47.111.8.123/32,no-resolve` | 直播吧 | 随直播吧广告规则一并维护，具体用途未记录 |
| `DOMAIN-SUFFIX,mssdk.volces.com` | 通用 SDK | 火山引擎移动端 SDK 域名 |
| `DOMAIN-SUFFIX,tanx.com` | 通用 SDK | 阿里妈妈广告平台 |

均为 `REJECT`。用途说明来自域名含义或维护记录，未逐一抓包确认。

### 为什么不需要 MITM

域名与 IP 规则只依据连接目标判断：域名来自 DNS 映射，以及 TLS 握手中明文的 SNI。连接在建立阶段即被拒绝，不需要解密 HTTPS。只有需要按 URL 路径或响应内容区分广告时才需要 MITM。

0.1.1 起，四条域名规则均带 `extended-matching`，除请求主机名外，还会匹配 TLS SNI 与 HTTP `Host`（HTTP/2、HTTP/3 为 `:authority`）。App 绕过系统 DNS 直接用 IP 连接（例如 HTTPDNS）时，域名规则仍能命中。如果连接既不带 SNI 也不带 Host，仍只能依靠 IP 规则。`webstat.qiumibao.com` 已由常见公共拒绝列表覆盖，本模块不重复收录。

### 刻意不拦截

- `bifen3.qiumibao.com`：可能同时承载比分等正常数据。
- `img1.360buyimg.com`：图片 CDN，可能同时承载正常图片。

这类主机只能按路径或响应内容精确处理，整域拦截有误伤风险，本模块不处理。

## 限制

- `mssdk.volces.com` 与 `tanx.com` 不是直播吧专属域名，启用后对设备上所有 App 生效。若其他 App 出现登录验证、风控校验或页面加载异常，先停用本模块排查。
- 模块规则优先于主配置规则匹配，所以本模块的拒绝规则会先于主配置中的直连例外生效。需要放行时，应停用本模块，不要依赖主配置例外。
- 只做域名/IP 拦截，不保证去除所有开屏、信息流或内嵌推广；IP 地址可能随服务端调整而失效。

## 验证与回退

启用后彻底退出并重开直播吧，检查启动、比分、直播列表、资讯和视频播放；同时留意其他常用 App 是否异常。异常时停用本模块即可恢复，无需修改主配置。`tests/test_zhibo8_adblock.py` 仅检查模块语法与规则清单，不替代实机验证。

## 来源

规则由仓库维护者根据实际使用整理，未引用第三方模块或脚本。
