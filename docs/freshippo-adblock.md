# 盒马 · 广告与页面精简

**0.1.0 测试版。** 使用 Surge 内置 JQ 与 Map Local 精简盒马首页、底栏、我的页面及推荐流；无外部脚本依赖。仅解密 `acs-m.freshippo.com` 一个主机。

## 安装

| GitHub 原始文件 | 镜像下载 |
| --- | --- |
| [Raw](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Freshippo-AdBlock-Lite.sgmodule) | [镜像模块](https://gh-proxy.com/https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Freshippo-AdBlock-Lite.sgmodule) |

在 Surge 的「模块 → 安装新模块」中粘贴上述地址。需要 Surge iOS 5.14.0+、开启重写与 MITM，并已安装、完全信任 Surge CA 证书。启用前先停用其他盒马去广告模块。

## 范围与相对上游的修正

1. **修复上游 `querysinglepage` 规则自相矛盾的问题**
   - 上游同时在 `Map Local` 中将 `mtop.wdk.render.querysinglepage` 整页替换为空对象 `{}`，又在 `Body Rewrite` 中为其编写了 `pageType == "216"`（逛门店页）的 JQ 保留逻辑，导致 JQ 规则被 `Map Local` 完全遮蔽。
   - 本模块从 `Map Local` 中移除了 `querysinglepage`，使其正常交由 `http-response-jq` 按 `pageType` 处理。
2. **防御式 JQ 改写（`[Body Rewrite]`）**
   - 首页（`queryindexpage`，`pageType == "1"`）、Tab 信息流（`querytabfeedstream`，`pageType == "5"`）、频道/单页（`querychannelpage` / `querysinglepage`，`pageType == "216"`）及“我的”页面（`querymypage`）按场景编码过滤推广区块。
   - 底栏配置（`decideformain` / `decidebygeocode`）仅保留首页（`HOME`）、分类（`CLASSIFY`）、购物车（`CART`）和我的（`MY`）四个核心 Tab。
   - 全部 JQ 表达式均增加对象/数组类型校验与 `try ... catch $original` 回退保护。
3. **Map Local（返回 `{}`）**
   - 对内页弹窗、凑单搭配推荐（`collocation`）、信息流推荐服务（`feedscommondservice`）、搜索页推广等 6 个接口返回空对象 `{}`。

## 限制

- 本模块沿用上游对首页、“我的”页面与搜索推广的**场景白名单策略**（例如 `querysearchpage` 与 `getshopinfolist` 返回空对象）。若盒马更新页面结构，或你需要使用搜索发现页热词、门店列表详情等被精简的区块，请暂时停用本模块。

## 验证与回退

```sh
python3 tests/test_freshippo_adblock.py
```

启用后彻底退出并重开盒马 App。如遇页面区块缺失或加载异常，直接停用本模块即可恢复。

## 参考来源

- 接口规则参考可莉盒马去广告模块（[Repcz/Tool 镜像](https://github.com/Repcz/Tool/blob/dab2af5b1c4846332fb99cea0586e8ec7a5a2068/Surge/Module/Kelee/MrHema_remove_ads.sgmodule)）。
