# 直播吧 · 广告域名补充

**0.2.0 测试版。** 纯域名/IP 拦截模块，无需 MITM、重写或脚本，无需填写参数。

## 安装

| GitHub 原始文件 | 镜像下载 |
| --- | --- |
| [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Zhibo8-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Zhibo8-AdBlock-Lite.sgmodule) |

在 Surge 的「模块 → 安装新模块」中粘贴上述地址（已安装旧版的设备可在模块页面直接更新到 `0.2.0`）。如果主配置 `[Rule]` 中已有相同的手写规则，启用本模块后可注释或删除主配置里的重复行，以便需要时能直接通过模块开关控制。发布到仓库不会自动修改设备上的配置。

## 范围

| 规则 | 类别 | 说明 |
| --- | --- | --- |
| `DOMAIN-SUFFIX,ggck.qiumibao.com` | 直播吧 | 广告接口（解析至阿里云杭州 ALB） |
| `DOMAIN-SUFFIX,bifen3.qiumibao.com` | 直播吧 | 0.2.0 恢复拦截；实机验证不拦截此域及对应 IP 时广告仍会展示 |
| `DOMAIN-SUFFIX,tongji.qiumibao.com` | 直播吧 | 统计接口（解析至阿里云杭州 ALB） |
| `DOMAIN-SUFFIX,apimg.dongdianqiu.com` | 体育图片/推广 | 0.2.0 恢复拦截，随直播吧规则一并维护 |
| `IP-CIDR,47.99.237.245/32,no-resolve` | 阿里云杭州 | 直播吧关联直连 IP |
| `IP-CIDR,118.178.168.156/32,no-resolve` | 阿里云杭州 | 直播吧关联直连 IP |
| `IP-CIDR,203.119.204.80/32,no-resolve` | 杭州电信 | 直播吧关联直连 IP |
| `IP-CIDR,118.178.122.133/32,no-resolve` | 阿里云杭州 | 直播吧关联直连 IP |
| `IP-CIDR,47.114.58.47/32,no-resolve` | 阿里云 | 直播吧关联直连 IP |
| `IP-CIDR,47.110.246.204/32,no-resolve` | 阿里云杭州 ALB | `bifen3.qiumibao.com` 解析池节点之一 |
| `IP-CIDR,47.111.8.123/32,no-resolve` | 阿里云杭州 | 直播吧关联直连 IP |
| `DOMAIN-SUFFIX,mssdk.volces.com` | 通用 SDK | 火山引擎移动端 SDK 域名 |
| `DOMAIN-SUFFIX,tanx.com` | 通用 SDK | 阿里妈妈广告平台 |

均为 `REJECT`。

### 为什么 0.2.0 补齐了 `bifen3.qiumibao.com` 与 6 个杭州 IP

1. **DNS 解析归属确认**：`ggck.qiumibao.com`、`bifen3.qiumibao.com`、`tongji.qiumibao.com` 均通过 CNAME 指向阿里云杭州负载均衡（`*.cn-hangzhou.alb.aliyuncsslb.com`），其中 `47.110.246.204` 直接位于 `bifen3.qiumibao.com` 的当前解析记录中，其余杭州阿里云/电信 IP 也属于同一业务体系的直连节点。
2. **实机验证结果**：0.1.1 曾出于保守考虑移除了 `bifen3.qiumibao.com`、`apimg.dongdianqiu.com` 和上述 6 个 IP，实机测试证实仅靠剩余 4 个域名无法拦住直播吧广告（App 会通过 `bifen3.qiumibao.com` 或不带域名特征的 IP 直连拉取广告）。0.2.0 将这批经实机验证必需的规则完整收回模块。

### 刻意不拦截

- `img1.360buyimg.com`：京东通用商品图片 CDN，整域拦截会导致京东及内嵌电商图片裂图，本模块不收录。

## 限制

- `bifen3.qiumibao.com` 整域拦截后，若直播吧部分赛事比分或数据页出现加载空白，需停用本模块恢复。
- `mssdk.volces.com` 与 `tanx.com` 以及阿里云共享 ALB IP 对设备上所有 App 生效。若其他 App 出现异常，先停用本模块排查。
- 模块规则优先于主配置规则匹配；需要放行时应直接停用本模块。

## 验证与回退

启用或更新到 `0.2.0` 后，彻底退出并重开直播吧，检查开屏、信息流、比分、直播列表和视频播放。异常时停用本模块即可恢复。`tests/test_zhibo8_adblock.py` 仅检查模块语法与规则清单，不替代实机验证。

## 来源

规则由仓库维护者根据实机抓包与验证记录整理，未引用第三方模块或脚本。
