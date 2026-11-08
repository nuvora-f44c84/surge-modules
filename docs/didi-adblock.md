# 滴滴出行 · 广告过滤

**0.1.0 测试版。** 使用域名拦截、Surge 内置 JQ 与 Map Local 清理滴滴出行开屏、首页横幅、顺风车/代驾活动弹窗及推荐目的地；无外部脚本依赖。

## 安装

| GitHub 原始文件 | 镜像下载 |
| --- | --- |
| [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/DiDi-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/DiDi-AdBlock-Lite.sgmodule) |

在 Surge 的「模块 → 安装新模块」中粘贴上述地址。需要 Surge iOS 5.14.0+、开启重写与 MITM，并已安装、完全信任 Surge CA 证书。启用前先停用其他滴滴去广告模块。

## 范围与相对上游的改进

1. **广告与追踪域名拦截（`[Rule]`）**
   - `gwp.xiaojukeji.com`、`gwpgz.diditaxi.com.cn`、`adtrack.xiaojukeji.com`（均为 `REJECT,extended-matching`）。
2. **JQ 响应改写（`[Body Rewrite]`）**
   - 合并上游对 `conf.diditaxi.com.cn/homepage/v\d/other/slow` 与 `fast` 的 9 条散落规则，清理首页底部横幅、流失召回横幅、沟通卡、猜你喜欢及场景推荐卡片。
   - 清理 `poi.map.xiaojukeji.com` 起点/POI 接口中的 `rec_destination` 推广目的地。
   - 清理 `htwkop.xiaojukeji.com` 卖卡汇总与福利中心数据（补齐原 Loon 插件中未转入第三方 Surge 镜像的两条规则）。
   - 所有 JQ 表达式均包裹 `. as $original | try (...) catch $original`，遇到非预期 JSON 结构时原样放行。
3. **取消上游的高风险白名单过滤**
   - 上游对 `homepage/v\d/core`（首页核心导航栏）、`usercenter/layout`（个人中心与钱包，上游仅保留“优惠卡券”而删掉了余额、出行卡和发票等入口）、`dache_homepage_layout`、`getFullPageInfoLayout` 及 `pinchengle_homepage_layout` 使用了固定 ID 白名单。
   - 本模块**刻意取消上述 5 处死板白名单与代驾开关白名单（`apolloToggle`）**，避免误删钱包余额、接送机/包车等正常业务入口。
4. **Map Local（返回 `{}`）**
   - 对 `res.xiaojukeji.com/resapi/activity/mget` 及代驾、顺风车、货运的弹窗/投放批量接口返回空 JSON 对象。
5. **MITM 范围**
   - 仅追加规则涉及的 10 个主机：`as.xiaojukeji.com, conf.diditaxi.com.cn, common.diditaxi.com.cn, res.xiaojukeji.com, api.udache.com, daijia.kuaidadi.com, htwkop-st.xiaojukeji.com, htwkop.xiaojukeji.com, freight.xiaojukeji.com, poi.map.xiaojukeji.com`。

## 限制

- 因取消了个人中心与首页导航栏的激进白名单，“我的”页面和顶部导航栏中的部分非常规运营入口会保留，换取钱包余额与全部出行服务正常显示。
- 启用后需彻底退出并重开滴滴出行 App。异常时停用本模块即可恢复。

## 验证与回退

```sh
python3 tests/test_didi_adblock.py
```

## 参考来源

- 接口线索参考可莉滴滴去广告模块（[Repcz/Tool 镜像](https://github.com/Repcz/Tool/blob/dab2af5b1c4846332fb99cea0586e8ec7a5a2068/Surge/Module/Kelee/DiDi_remove_ads.sgmodule)）。
