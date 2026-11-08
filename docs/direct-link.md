# 外链中转页 · 自动直跳（测试版）

在 Surge `http-request` 阶段自动提取并 URL 解码国内常见平台的外链中转页目标地址，直接在本地返回 `HTTP 302` 重定向，跳过“即将离开本站 / 非官方页面请谨慎访问”二次确认页。

## 安装

固定远程地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Direct-Link.sgmodule
```

在 Surge 模块页面从该地址安装并启用。需要开启脚本、MITM，并已安装与信任 Surge CA 证书。

## 支持范围与参数映射

| 平台 | 匹配域名与路径 | 提取的查询参数 |
| --- | --- | --- |
| 知乎 | `link.zhihu.com/?target=...` | `target` |
| CSDN | `link.csdn.net/?target=...` | `target` |
| 掘金 | `link.juejin.cn/?target=...` | `target` |
| 简书 | `www.jianshu.com/go-wild?url=...`、`jianshu.com/go-wild?url=...` | `url` |
| 腾讯 / QQ | `c.pc.qq.com/middlem.html`、`/ios.html`、`/pc.html`、`/index.html` | `pfurl`、`url`、`tourl` |
| QQ 邮箱 | `mail.qq.com/cgi-bin/readtemplate?gourl=...` | `gourl` |
| 微博 | `weibo.cn/sinaurl?u=...`、`?toasturl=...`、`?url=...` | `u`、`toasturl`、`url` |

## 为什么使用 `http-request` 脚本而不是纯正则 `URL Rewrite 302`

中转链接中的目标 URL 经过了百分号编码（如 `target=https%3A%2F%2Fgithub.com%2F...`）。若使用纯 `[URL Rewrite]` 的正则 `302 $1`，响应头 `Location` 的值会保持为 `https%3A%2F%2F...`，浏览器会将其当作当前域名下的相对路径（`https://link.zhihu.com/https%3A%2F%2F...`），直接导致 `404`。

本模块通过本仓库自维护的无依赖轻量脚本 [`Direct-Link.js`](../scripts/Direct-Link.js)（`requires-body=0`，不读取请求体、不写日志、不发网络请求）：

1. 提取对应的查询参数并执行最多两层 `decodeURIComponent`。
2. 严格校验解码后的结果必须为合法的 `http://` 或 `https://` 绝对 URL（拒绝 `javascript:`、`data:` 伪协议及包含换行/控制字符的输入，防止开放重定向与响应头注入）。
3. 校验通过时直接在本地构造 `302` 响应，零网络往返直达目标网址；若未带明文 URL 参数（例如微博 `weibo.cn/sinaurl?f=...` 仅携带加密短链 token），则自动调用 `$done({})` 原样放行给服务端处理。

## 为什么不包含微信 `weixin110.qq.com`

1. 微信拦截页（`weixin110.qq.com/cgi-bin/mmspamsupport-bin/newredirectconfirmcgi`）不在 URL 查询参数中携带明文目标网址，而是将目标网址嵌在服务端返回的 HTML `<script>` 变量 `cgiData` 中。
2. 审阅上游 `VirgilClyne/GetSomeFries`（`Fries.WeChat.sgmodule` / `WeChat.response.js`）发现：
   - 上游脚本使用 `const PATH = url.pathname`（包含前导 `/`），但 `switch (PATH)` 匹配的是无前导斜杠的 `"cgi-bin/mmspamsupport-bin/newredirectconfirmcgi"`，导致该分支实际无法命中；
   - 上游脚本直接对网页 HTML 中的 `<script>` 内容执行 `eval(script)`，且将完整访问 URL 写入持久日志。
3. 因此本模块不包含 `weixin110.qq.com`，只处理查询参数中含明文目标网址的中转页。

## 验证与回退

运行自动化测试（覆盖模块语法、URL 正则边界、单/双层编码解码、伪协议拦截与无明文参数放行）：

```sh
node --check scripts/Direct-Link.js
python3 tests/test_direct_link.py
```

若某个网站的外链跳转异常，在 Surge 模块列表中停用 `外链中转页 · 自动直跳` 即可立即恢复默认行为。
