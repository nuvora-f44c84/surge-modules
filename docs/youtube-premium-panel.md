# YouTube · Premium 解锁面板（测试版）

远程 Surge 面板模块（`0.1.1`），用于查看当前网络分流或指定代理策略下的 YouTube Premium 地区可用性、实际落地节点名称、个人方案参考月费与请求耗时。模块自动拉取远程脚本，**无需 MITM、无需重写、不修改主配置分流规则，也不携带任何账号 Cookie**。

## 安装

固定远程模块地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/YouTube-Premium-Panel.sgmodule
```

在 Surge 的**模块**页面通过上述地址安装并启用即可。默认参数（`policy=auto`）会自动按当前 Surge 分流规则请求 `www.youtube.com`，开箱即用。

固定远程脚本地址（供主配置自定义引用）：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/YouTube-Premium-Panel.js
```

## 模块参数

在 Surge 模块详情页点击**配置参数**可按需调整：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `policy` | `auto` | `auto`（或留空）按当前分流规则匹配；也可填写已有策略或策略组名（如 `YouTube`、`Example Proxy`），或用英文逗号分隔最多 4 个策略同卡并发对比（如 `YouTube,Backup`） |
| `price` | `true` | `true` 在确认解锁时展示页面公开的个人月付参考价；`false` 仅展示地区 |
| `timeout` | `8` | 单次请求超时秒数，范围 `2`–`20` |
| `interval` | `3600` | 面板自动刷新间隔（秒），默认 `3600`（1 小时）；设为 `-1` 则仅手动点击刷新 |
| `title` | `YouTube Premium` | 面板卡片标题前缀 |

## 显示效果示例

1. **单策略模式（默认，自动识别实际落地节点名称）**
   - 标题：`YouTube Premium · 已解锁`
   - 内容：
     ```text
     地区：🇺🇸 美国 (US) · 个人 $15.99/月
     节点：🇺🇸 Example Node · 220 ms · 12:30
     ```

2. **多策略同卡对比模式**（如设置 `policy=GroupA,GroupB`，自动展开各自落地节点）
   - 标题：`YouTube Premium · 1/2 已解锁 · 12:30`
   - 内容：
     ```text
     🇯🇵 Example JP：已解锁 · 🇯🇵 日本 · ¥1,280/月 · 185ms
     🇲🇴 Example MO：未解锁 · 🇲🇴 澳门 · 92ms
     ```

3. **主配置独立 `[Script]` / `[Panel]` 引用示例（可选）**
   ```ini
   [Script]
   yt-premium-panel = type=generic,timeout=25,engine=jsc,script-path=https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/YouTube-Premium-Panel.js,argument="policy1=Example%20Proxy%20A&name1=主力&policy2=Example%20Proxy%20B&name2=备用&timeout=8"

   [Panel]
   YouTube解锁 = script-name=yt-premium-panel,title=YouTube Premium,content=点击刷新检测解锁状态,update-interval=3600
   ```

## 判定口径与限制

1. **正向完整权益校验（与本仓库 `CF-AutoRank` 口径一致）**：
   - 脚本仅将 `https://www.youtube.com/premium?hl=en` 返回的 `ytInitialData` 作为纯 JSON 数据解析（不执行任何网页代码），要求同时满足：
     - HTTP 状态码为 `200`（禁用自动跟随重定向，防止被 `302` 跳转页误导）；
     - 页面中 `"INNERTUBE_CONTEXT_GL"` 国家/地区代码唯一且有效；
     - 存在处于激活状态（`BUTTON_VIEW_MODEL_STATE_ACTIVE`）、带明确标价且指向完整 `SPunlimited`（`/premium`）的购买入口。
   - 不会仅因页面未出现 `"not available"` 字样就误判为“已解锁”。
2. **明确区分各类非解锁状态**：
   - **未解锁**：页面明确提示当前国家/地区不提供 YouTube Premium（若页面包含出口地区代码会一并展示，便于排查分流）；
   - **仅 Lite**：当前地区仅提供 `/premiumlite` 方案，无完整 Premium 入口；
   - **国家未验证**：命中 `"We couldn't verify your country"`（常见于部分广播 IP 或地理位置异常出口）；
   - **触发验证 / 请求受限**：命中 Google `/sorry/` 风控跳转、`consent.youtube.com` 同意页、验证码或 `HTTP 429`。
3. **注意事项与限制**：
   - 检测结果仅代表**匿名网络出口**在 YouTube 落地页的地区可用性，不验证个人 Google 账号的会员订阅状态或家庭组资格。
   - 单次检测接收约 `150 KB`–`250 KB` 压缩传输数据（解压后 HTML 约 `1 MB`），建议保持 `interval=3600` 或设为 `-1` 按需手动刷新，避免频繁请求消耗流量或触发 Google `429` 限流。
   - 遇到 `TW` 地区时面板直接显示 `台湾 (TW)` 文本，避免部分国行硬件系统字体将旗帜字符渲染为缺失字形框。

## 验证与回退

本地语法与自动化测试：

```sh
node --check scripts/YouTube-Premium-Panel.js
node --test tests/youtube-premium-panel.test.cjs
```

如需停用面板，在 Surge 模块列表中关闭或删除 `YouTube · Premium 解锁面板` 即可，不会残留任何规则或重写配置。
