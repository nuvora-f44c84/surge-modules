# 阿里系核心业务直连

这是 Surge `RULE-SET` 规则集，包含 13 条 `DOMAIN-SUFFIX` 规则，让淘宝、天猫、支付宝、菜鸟等核心业务走直连，避免商品详情等接口因海外出口被判定为受限地区。它不是 `.sgmodule` 模块，不需要 MITM 或脚本。

## 引用

固定地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/Alibaba-Direct.list
```

在主配置的 `[Rule]` 中添加以下一行，并将 `DIRECT` 替换为已有的直连策略名称（也可以直接使用 `DIRECT`）：

```ini
RULE-SET,https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/Alibaba-Direct.list,DIRECT
```

替换原有的逐条手写规则时，把这一行放在原规则所在位置，再删除原来的单条规则。

## 规则顺序（重要）

**必须放在所有去广告拒绝规则之后。**

常见公共拒绝列表在这些后缀下拦截了 70 多个广告与统计子域名（2026-11-06 统计 SKK 与秋风规则，去重后 76 个），例如 `simba.taobao.com`、`adash.m.taobao.com`、`loggw.alipay.com`。规则按顺序匹配：本列表若排在拒绝规则前面，这些子域名会先命中直连，广告和统计请求将重新放行。

出于同样原因，本列表**不做成模块**：模块中的规则总是优先于主配置规则匹配，无法排在主配置的拒绝规则之后。

建议放在拒绝规则之后、AI 分流和常用海外网站规则之前，即与原手写规则相同的位置。

## 范围与限制

- `DOMAIN-SUFFIX` 覆盖所列域名及其全部子域名；未被前面规则拦截的子域名都会走直连。
- 不含 IP、ASN、进程或阿里云通用域名（如 `aliyun.com`、`aliyuncs.com`），不影响阿里云上托管的其他服务。
- 原手写规则未带 `extended-matching`，引用示例也不带，以保持原有行为。如需在 App 直接用 IP 连接时也按 SNI / Host 匹配，可自行在引用行末尾加上该参数。
- 远程规则由 Surge 下载并缓存；未指定 `update-interval` 时默认每 24 小时更新一次，下载失败时使用缓存。

## 验证

外部资源下载就绪后，在 Surge 中打开淘宝商品详情和支付宝，确认正常加载；在最近请求中核对 `*.taobao.com` 命中本规则集、广告子域名仍命中拒绝规则。`tests/test_alibaba_direct.py` 仅检查规则清单格式，不验证实际分流。

## 来源

规则由仓库维护者根据实际使用整理，未引用第三方列表。
