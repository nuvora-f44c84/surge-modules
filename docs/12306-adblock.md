# 铁路 12306 · 广告过滤

**0.1.0 测试版。** 仅处理 `ad.12306.cn/ad/ser/getAdList` 广告列表接口，使用 Surge 内置 JQ 移除响应中的广告素材与倒计时参数；无外部脚本依赖，不解密购票业务网关。

## 安装

| GitHub 原始文件 | 镜像下载 |
| --- | --- |
| [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/12306-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/12306-AdBlock-Lite.sgmodule) |

在 Surge 的「模块 → 安装新模块」中粘贴上述地址。需要 Surge iOS 5.14.0+、开启重写与 MITM，并已安装、完全信任 Surge CA 证书。启用前先停用其他处理 `12306` 的同类模块。发布到仓库不会自动更改设备上的配置。

## 原理与范围

1. **前置直连规则（`DOMAIN,ad.12306.cn,DIRECT,extended-matching`）**
   部分公共去广告规则集（如 `AWAvenue-Ads-Rule`）对 `ad.12306.cn` 采用整域 `REJECT`。若直接断网拒绝，客户端可能触发网络超时或回退展示默认开屏画面。模块规则优先于主配置规则执行，先将 `ad.12306.cn` 放行直连，交由后续 JQ 改写响应体。
2. **JQ 响应改写（`ad.12306.cn/ad/ser/getAdList`）**
   对 `https://ad.12306.cn/ad/ser/getAdList` 返回的 JSON 对象删除顶层 `materialsList`（广告素材列表）与 `advertParam`（跳过时间等展示参数），保留 `code`、`rid`、`message` 等外层状态字段。非 JSON 对象或异常结构原样返回。
3. **MITM 范围**
   仅追加 `ad.12306.cn`。

### 刻意不处理的域名

- **`mobile.12306.cn`（`/otsmobile/app/mgs/mgw.htm`）**：该接口是 12306 客户端的统一 mPaaS 网关，同时承载登录状态检查、余票查询、候补、下单与支付等核心请求。部分第三方模块通过解密该主机并按 `Operation-Type` 请求头拦截资讯或活动卡片，但把核心购票网关纳入 MITM 与脚本链路会增加购票请求故障面（且部分自动转换的 Surge 脚本调用 `$done()` 在 Surge `http-request` 中并不会实际拦截请求）。本模块刻意不解密 `mobile.12306.cn`，也不拦截其网关请求。
- **`kyfw.12306.cn`**：核心票务域名，不触碰。

## 限制

- 仅处理 `ad.12306.cn/ad/ser/getAdList` 下发的开屏及横幅广告，**不去除**由 `mobile.12306.cn` 网关下发的首页底栏资讯流、会员常见问题或出行服务推广卡片。
- 由于 `ad.12306.cn` 被设为 `DIRECT`，该主机下除 `getAdList` 外的其他路径请求也将直连放行，不再命中主配置中排在后面的整域 `REJECT` 规则。
- 已缓存在客户端本地的开屏素材可能需要联网刷新并彻底重开 App 后才会消失。

## 验证与回退

```sh
python3 tests/test_12306_adblock.py
```

启用模块后彻底退出并重开 12306，检查冷启动开屏、车票查询、登录及订单页面是否正常。若出现加载异常，直接停用本模块即可恢复，无需修改主配置。自动化测试仅验证模块语法、URL 边界和 JQ 过滤逻辑，不能替代实机验证。

## 参考来源

- 接口路径与字段线索参考 RuCu6 / 可莉公开模块（[Repcz/Tool 镜像](https://github.com/Repcz/Tool/blob/dab2af5b1c4846332fb99cea0586e8ec7a5a2068/Surge/Module/Kelee/12306_remove_ads.sgmodule)）。本模块仅采用 `ad.12306.cn/ad/ser/getAdList` 的字段删除思路，按防御式 JQ 独立编写，未复制其脚本文件，也未引入 `mobile.12306.cn` 规则。
- [Surge JQ Body Rewrite 文档](https://manual.nssurge.com/http/body-rewrite.html)
