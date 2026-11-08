# 微信公众号与小程序 · 广告过滤

包含两个独立的无脚本模块：**微信公众号 · 广告过滤**（`0.1.0` 测试版）与**微信小程序 · 广告过滤（无脚本版）**（`0.1.0` 测试版）。两者均可按需单独启用，无外部 JS 脚本依赖。

## 安装

| 模块 | GitHub 原始文件 | 镜像下载 |
| --- | --- | --- |
| 微信公众号 · 广告过滤 | [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/WeChat-Official-Accounts-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/WeChat-Official-Accounts-AdBlock-Lite.sgmodule) |
| 微信小程序 · 广告过滤（无脚本版） | [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/WeChat-MiniPrograms-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/WeChat-MiniPrograms-AdBlock-Lite.sgmodule) |

在 Surge 的「模块 → 安装新模块」中粘贴上述地址。需要 Surge iOS 5.14.0+、开启重写与 MITM，并已安装、完全信任 Surge CA 证书。启用前先停用其他处理同域名的微信去广告模块。

## 一、微信公众号 · 广告过滤

### 范围
1. **规则拦截**：`DOMAIN-SUFFIX,wxs.qq.com,REJECT,extended-matching`（微信广告素材与推广分发域）。
2. **Map Local（返回 `{}`）**：
   - `mp.weixin.qq.com/mp/getappmsgad`：公众号文章中部与底部横幅广告。
   - `mp.weixin.qq.com/mp/cps_product_info`：公众号文章内嵌带货返利商品卡。
   - `mp.weixin.qq.com/mp/jsmonitor`：前端监控上报。
   - `mp.weixin.qq.com/mp/masonryfeed` 与 `relatedarticle`：文章底部推荐流与相关阅读。
   - `mp.weixin.qq.com/mp/relatedsearchword`：文章正文内的蓝色放大镜搜索关键词高亮链接。
3. **MITM 主机**：仅 `mp.weixin.qq.com`。

### 限制
- `relatedarticle` 与 `masonryfeed` 被返回空对象后，文章底部的“继续滑动看下一个 / 相关阅读”将一并隐藏。如需查看公众号底部相关文章，可停用本模块。

---

## 二、微信小程序 · 广告过滤（无脚本版）

### 范围与相对上游的裁剪改进
覆盖常用生活服务小程序（丰巢、顺丰、中通、EMS、美团扫码点餐、收钱吧、星巴克、麦当劳、必胜客、企迈点单、猫眼、微信话费充值、哈啰、怪兽/街电/来电/松果充电宝、华住/锦江/首旅如家酒店、携程、途虎、滴滴青桔/代驾等）的弹窗与横幅接口。

相比上游 `WexinMiniPrograms_Remove_ads` 所做的安全收敛：
1. **彻底剔除 12 个外部远程 JS 脚本**：不再加载任何未锁版本的第三方远程 JS，仅保留 `[Rule]`、`[URL Rewrite]`、防御式 `[Body Rewrite]`（内置 JQ）与 `[Map Local]`。
2. **剔除无路径的整域 `Map Local` 规则**：移除了上游对 `applets.jtexpress.com.cn`（极兔速递）和 `smarket.dian.so` 的整域空 JSON 覆盖，避免阻断小程序正常业务接口。
3. **剔除 `mobile.12306.cn` 及孤立 MITM 主机**：不将 `mobile.12306.cn` 或已整域 `REJECT` 的 `ad.maoyan.com` 放入 MITM，MITM 列表与重写/本地映射主机保持严格对应（共 80 个主机）。
4. **合并重复 JQ 并补齐类型保护**：将 `chong.qq.com` 与 `saas-ad.cloudpnr.com` 的多条重复 JQ 规则合并，并加上 `. as $original | try (...) catch $original` 兜底。

### 限制
- 仅覆盖列表内已收录的小程序接口；剔除外部脚本的少数茶饮/便利店小程序（如古茗、茶颜悦色、全家、CoCo 的复杂首页结构）不再修改响应体。
- 小程序接口路径随版本迭代可能变化；若某个小程序出现页面空白或加载异常，先停用本模块排查。

## 验证与回退

```sh
python3 tests/test_wechat_adblock.py
```

异常时直接停用对应模块即可恢复。

## 参考来源

- 接口线索参考 RuCu6 与可莉公开模块（[微信公众号](https://github.com/Repcz/Tool/blob/dab2af5b1c4846332fb99cea0586e8ec7a5a2068/Surge/Module/Kelee/Weixin_Official_Accounts_remove_ads.sgmodule)、[微信小程序](https://github.com/Repcz/Tool/blob/dab2af5b1c4846332fb99cea0586e8ec7a5a2068/Surge/Module/Kelee/WexinMiniPrograms_Remove_ads.sgmodule)）。
