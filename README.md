# Surge 模块

个人维护的 Surge 模块、补充规则集与面板脚本。远程模块放在 `modules/`，远程规则集放在 `rules/`，远程脚本放在 `scripts/`。

## 模块列表

| 模块 | 当前状态 | 远程地址 |
| --- | --- | --- |
| Cloudflare 一键优选 | 0.1.23 · 1280 个轻量初筛 → 160 候选下载初筛 → 按排名查 Premium → 复测与复核 → 合格前十，默认省流，预览版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/CF-AutoRank.sgmodule) |
| 高德地图推广过滤 | 0.2.0 · 个人主页推广过滤，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Amap-AdBlock.sgmodule) |
| 豆瓣开屏广告过滤 | 0.2.0 · 预加载与展示接口 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Douban-Splash-AdBlock.sgmodule) |
| 小宇宙广告过滤 | 0.2.0 · 开屏及首页明确标记的推广横幅 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Xiaoyuzhou-Splash-AdBlock.sgmodule) |
| 咪咕视频 · 广告域名补充 | 0.1.0 · 6 个精确域名，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/MiguVideo-AdBlock-Lite.sgmodule) |
| 航旅纵横 · 去广告 | 0.2.1 · 开屏拦截、精简首页与我的页面，上游脚本锁定提交，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Umetrip-AdBlock-Lite.sgmodule) |
| 直播吧 · 广告域名补充 | 0.2.0 · 6 个域名（含 SNI/Host 匹配）及 7 个关联 IP，无需 MITM，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Zhibo8-AdBlock-Lite.sgmodule) |
| 铁路 12306 · 广告过滤 | 0.1.0 · 直连放行 `ad.12306.cn` 并用 JQ 移除 `getAdList` 广告素材，无脚本，不碰购票网关，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/12306-AdBlock-Lite.sgmodule) |
| 微信公众号 · 广告过滤 | 0.1.0 · 拦截 `wxs.qq.com` 并清空文章内广告、带货商品卡与正文搜索热词，无脚本，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/WeChat-Official-Accounts-AdBlock-Lite.sgmodule) |
| 微信小程序 · 广告过滤（无脚本版） | 0.1.0 · 常用生活服务小程序去广告，剔除全部外部脚本与整域清空规则，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/WeChat-MiniPrograms-AdBlock-Lite.sgmodule) |
| 滴滴出行 · 广告过滤 | 0.1.0 · 清理首页横幅、顺风车/代驾弹窗及推荐目的地，取消钱包与导航白名单，无脚本，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/DiDi-AdBlock-Lite.sgmodule) |
| 盒马 · 广告与页面精简 | 0.1.0 · 精简首页、底栏、我的页面及推荐流，修复单页规则冲突，无脚本，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Freshippo-AdBlock-Lite.sgmodule) |
| YouTube · LLM 翻译字幕 | 0.1.0 · 自备后端、默认中文双语、重复中文去重，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/YouTube-LLM-Captions.sgmodule) |
| YouTube · Premium 解锁面板 | 0.1.0 · 当前分流或指定策略解锁检测、个人月费参考价、支持多策略对比，无需 MITM，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/YouTube-Premium-Panel.sgmodule) |
| 天气 · 美标 AQI（iRingo） | 0.1.1 · 官方 WeatherKit 脚本（本仓库 Raw 直供 + 每日自动巡检上游），美标 InstantCast，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/iRingo-WeatherKit-US.sgmodule) |
| 定位 · 地区检测（iRingo） | 0.1.0 · 官方远程脚本，仅网络地区检测，默认 US，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/iRingo-LocationService-US.sgmodule) |
| Siri 与聚焦搜索（iRingo） | 0.1.1 · 官方 Siri 脚本（本仓库 Raw 直供 + 每日自动巡检上游），解锁 Spotlight / 查询知识卡片并保持中文 Siri，移除 `debug=1`，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/iRingo-Siri-Spotlight.sgmodule) |
| TestFlight · 区域与通用应用（iRingo） | 0.1.1 · 官方 TestFlight 脚本（本仓库 Raw 直供 + 每日自动巡检上游），解除区域限制并开启通用应用安装，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/iRingo-TestFlight.sgmodule) |
| 外链中转页 · 自动直跳 | 0.1.0 · 请求阶段自动解码并 302 跳过知乎、CSDN、掘金、简书、QQ/QQ邮箱、微博外链确认页，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Direct-Link.sgmodule) |
| 哔哩哔哩 · PCDN 节点屏蔽 | 0.1.0 · 使用 `REJECT-NO-DROP` 屏蔽 77 个 B 站/猫耳 FM/派欧云/臻选云 PCDN 域名，促使播放器毫秒级切换商业主干 CDN，无需 MITM，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Bilibili-PCDN-Block.sgmodule) |

## AI 统一分流规则集（`AI.list`）与 X 规则集（`X.list`）

[AI.list 固定地址](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/AI.list) 聚合了 Apple Intelligence（PCC 与地区资格校验）、OpenAI、Anthropic/Claude、Google Gemini/AI Studio/Antigravity/NotebookLM、xAI/Grok、Meta AI/Muse 及 Cursor/Windsurf/Copilot 等共 266 条去重规则，由 GitHub Actions 每日自动巡检上游 `Sukka ai.conf` 与 `apple_intelligence.conf`（自动剔除 `api.github.com` 误伤项与中文 Siri 核心直连域名）。主配置只需引用一行，放在国内 AI 直连（`cn.list`）之后、[X.list 固定地址](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/X.list) 与 `Apple_All` 之前。原补充表 [`rules/AI-Supplement.list`](rules/AI-Supplement.list) 保留路径兼容。详见 [AI 统一规则集说明](docs/ai-list.md)。

## 阿里系核心业务直连规则集

[Alibaba-Direct.list 固定地址](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/Alibaba-Direct.list) 包含 13 条 `DOMAIN-SUFFIX` 规则（淘宝、天猫、支付宝、菜鸟及阿里静态资源），通过主配置的 `RULE-SET` 引用并指定直连策略。**必须放在所有去广告拒绝规则之后**，否则公共拒绝列表在这些后缀下拦截的广告与统计子域名会被直连放行；也因此不做成模块。不含 IP、ASN 或阿里云通用域名。引用方式与顺序要求见[阿里系直连说明](docs/alibaba-direct.md)。

## 微信输入法离线阻断规则集

[WeType-Reject.list 固定地址](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/WeType-Reject.list) 包含 9 条 `DOMAIN-SUFFIX` / `DOMAIN-KEYWORD` 规则，覆盖微信输入法（WeType）专属云端接口、更新域名及腾讯客户端通用统计/崩溃上报 SDK（灯塔、Bugly、链路追踪）。通过主配置的 `RULE-SET` 引用并指定拒绝策略与 `extended-matching`，**必须放在所有 `qq.com` 及国内直连规则之前**。不整域拦截微信主通信域，也不包含游戏反作弊遥测或宽泛 `ime` 关键字。引用方式、顺序与限制见[微信输入法阻断说明](docs/wetype-reject.md)。

## VPS 简洁流量面板脚本

[VPS-TrafficPanel.js 固定地址](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/VPS-TrafficPanel.js)（`0.2.0`）支持**单节点独立面板**与**二合一 / 多节点合并面板**（最多 6 台并发），可为每台 VPS 分别指定监控地址、流量配额、月重置日、请求策略与超时时间；任一节点超时或离线不影响其余已完成节点的真实流量展示。只显示流量、监控请求延时及重置天数，不添加分流规则；私人接口地址保留在本机参数中。引用方式、数据口径和限制见 [VPS 面板说明](docs/vps-traffic-panel.md)。

## Cloudflare 一键优选（预览版）

在当前 iPhone / Mac 网络中手动测试 CF 候选入口，取复测排名靠前且通过 YouTube Premium 地区可用性检测的 10 个不同 IP，自动更新已有 edgetunnel 后台自定义列表；成功后手动刷新原 Surge 订阅。默认省流档，保留完整档。模块自动下载远程脚本，只需填写后台域名和后台密码，无需手动放置文件；公开文件不含个人凭据。

后台上游为 **[cmliu/edgetunnel](https://github.com/cmliu/edgetunnel)**，提供 Cloudflare 隧道、管理面板与订阅；本仓库实现 Surge 端的测速、排名、出口国旗和自动回写。具体分工见[上游项目说明](docs/cf-autorank.md#上游项目与本模块的关系)。

手动刷新主面板：**更新池与备份 → 1280 个全部首检与必要第二检 → 最多 160 候选全部下载初筛 → 按初筛排名做 Premium 首检，凑满 24 个入围即停并紧接着补双检与稳定性检查 → 独占两段下载复测，不足时按需补选后备 → 出口与 Premium 发布前复核，失败则本轮淘汰补位 → 十个完整合格后保存并验证订阅**。0.1.20 将首次 Premium 检测提前到任何下载样本之前，不可用或未确认入口不下载；新鲜首检用于入围双检，超过 5 分钟则重新双检，发布前第三检仍保留。首检页面请求增加，不能保证整轮更快或总流量更低。0.1.19 保留全部首检覆盖及约 20% 随机探索，只省略确定不需要的第二次轻量检测，进入下载阶段仍须双检合格。首检自适应 8～16 并发，二检沿用首检最后实际验证的档位；Premium、稳定性和出口检查按节点串联、合计最多 4 并发，下载复测不与其他探测同时运行。首轮大下载后按速度上界安排第二轮，只省去已确定无法入选的第二次下载；平分继续复测，最终十个仍以两次有效样本中较低速度排名。后备先过 Premium 双检才做下载复测，额外复测最多 24 个，凑齐即停；0.1.21 起复核失败入口本轮淘汰，复用已测结果并按排名补位；被省略的第二次下载在需要时补测，后备共用原有 24 个复测预算。最终不足 10 个时保留原订阅；检测不验证会员账号资格。后台连接先直连，失败时按现有 Surge 规则重试；测速始终指定被测 CF 入口。成功后手动刷新原 CF 订阅。进度面板及自动刷新只读状态，不启动测速。0.1.18 增加 Premium 最终复核的具体失败原因与一次有条件的连接错误恢复；失败通知也可复制完整耗时与诊断摘要，地区和三检要求保持不变。完整顺序与请求路径见[操作流程](docs/cf-autorank.md#点击面板刷新后会发生什么)。

0.1.23 调整检测顺序与调度，保留最终节点的合格要求：Premium 改为在下载初筛之后按排名检查、凑满 24 个入围即停，不再给 160 个候选都拉一次 Premium 页面；轻量首检与必要二检去掉批次之间的空等。与冻结的 0.1.22 在九组合成场景中对照，最终十个、顺序和分数一致，模拟耗时缩短约 14–32%；这不是手机实测，也不保证真实网络每轮排名相同。小样本初筛仍可能漏掉持续下载更快的候选。详见[0.1.23 说明](docs/cf-autorank.md#0123-缩短等待初筛后按排名查-premium轻量检测去掉批次空等)。

0.1.22 让完整档保留已完成分段的数据，避免末尾超时使整次样本作废：8 MB / 8 秒内按 2 MB 分段采样，两次独立复测与 Premium 要求保留。日志分别显示实际档位、Premium、稳定性及下载失败原因；省流档采样不变。详见[完整档采样与诊断](docs/cf-autorank.md#0122-完整档分段采样与下载诊断)。

以后统一使用[固定模块地址](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/CF-AutoRank.sgmodule)。从旧版本地址迁移一次后，在 Surge 中更新同一个模块即可，后台参数保存在本机。带版本号的文件仅用于复现和回退；内部 JS 引用随模块更新。

“Cloudflare 一键优选”使用橙色云朵，点一次运行完整流程，下方两行显示上次成功时间、当时的 Wi-Fi/蜂窝网络、节点数、档位和数据量。独立的“Cloudflare 测速进度”面板只读本机记录，切回策略页面或点击刷新可查看阶段、数量、耗时及最近活动；长期无活动会提示可能暂停或中断，不保证 iOS 后台持续运行。

自动化检查覆盖模块语法和模拟数据；不同设备、网络和 App 版本的兼容性需分别确认。安装与限制见 [Cloudflare 优选说明](docs/cf-autorank.md)。

## 高德地图推广过滤（测试版）

高德模块按接口结构清理“我的”任务、活动轮播、推荐流、借钱入口及卡片内推广，保留订单、收藏、足迹和语音等功能。规则匹配不代表所有 App 版本均兼容；未知字段尽量保留。

在 Surge 模块页面从 Raw 地址安装或更新，确认版本 **0.2.0**。需要 Surge iOS 5.14.0+、重写、MITM 及已信任的证书。其他高德模块保持停用，再启用本模块并彻底退出、重开高德。发布不会自动替换手机上的旧模块。

取消旧版首页和“我的”的卡片保留列表，保留未知卡片及正常服务。订单、收藏、待评价、钱包、足迹、语音／车标设置、家人地图、工具、好友动态和勋章入口保留。使用内置 JQ，无远程脚本依赖。详细范围、已知限制和回退方法见[高德模块说明](docs/amap-ad-filter.txt)。

## 豆瓣开屏广告过滤

在 Surge 的模块页面通过上述 Raw 地址安装。需要 Surge iOS 5.14.0+、开启重写和 MITM，并安装、完全信任 Surge 证书。模块仅对 `api.douban.com` 的三个开屏接口清空广告列表、展示对象及备用投放数据，无外部脚本依赖；不处理豆瓣信息流广告。

豆瓣模块仅处理开屏广告。已缓存的素材可能需要联网并重新启动 App 后更新；效果受 App 版本、缓存和投放方式影响。

详细范围、验证方法和恢复方法见[豆瓣模块说明](docs/douban-splash.txt)。远程地址保持稳定，后续可通过 Surge 更新。

## 小宇宙广告过滤（测试版）

过滤开屏，并在首页 `discovery-feed/list` 的横幅数组中仅移除 `presetPurpose=OPERATIONAL` 或 `showAdIndicator=true` 的条目。保留普通推荐、编辑精选、榜单、顶部功能入口、未标记横幅和分页数据；不改写订阅、搜索、节目和播放接口。使用 Surge 原生 Map Local 与 JQ，无外部脚本，需 Surge iOS 5.14+、重写、MITM 和已信任的证书。

原开屏模块远程地址保持不变，更新到 **0.2.0** 后彻底退出并重开小宇宙。缓存素材可能需后续启动才消失，未带明确标记的推广保留；普通功能和不同 App 版本需分别验证。范围、来源和恢复步骤见[小宇宙模块说明](docs/xiaoyuzhou-splash.txt)。

## 咪咕视频与航旅纵横（测试版）

咪咕模块精确拦截 6 个域名，无需 MITM 或脚本；其中 `ggx05.miguvideo.com` 为实验候选，不保证移除所有广告或品牌倒计时。

航旅模块 `0.2.1` 拦截统计域名与开屏接口，并通过 `webview` 引擎及二进制模式运行上游 `xingjiu29/Umetrip` 的响应脚本，精简首页与“我的”页面推广。脚本锁定在已审阅的上游提交，不跟随分支自动变化。需要重写、脚本、MITM 和已信任证书；不再覆盖 0.1.0 处理的 `114.115.217.129` 端点。上游未声明许可，本仓库不对该模块声明许可。当前 App 的完整兼容性待实机验证。

两个模块均提供固定远程地址。迁移时停用同名本地模块，再启用远程版本；不要同时启用两份。安装链接（含镜像）、影响范围、上游来源和回退方法见[去广告模块说明](docs/lite-adblocks.md)。

## 直播吧 · 广告域名补充（测试版）

0.2.0 拦截直播吧相关的 4 个业务/广告域名（`ggck.qiumibao.com`、`bifen3.qiumibao.com`、`tongji.qiumibao.com`、`apimg.dongdianqiu.com`）、7 个杭州阿里云/电信关联直连 IP，以及 `mssdk.volces.com`、`tanx.com` 两个通用 SDK 域名；纯规则，无需 MITM 或脚本。域名规则带 `extended-matching`，同时匹配 SNI 与 Host。实机验证表明仅拦截 0.1.1 的 4 个域名不足以拦住直播吧广告（`bifen3.qiumibao.com` 解析池直接包含 `47.110.246.204` 等杭州 ALB 节点），因此恢复完整规则集；仅保留 `img1.360buyimg.com` 不拦截以免影响京东正常图片。若比分页面或其他 App 出现异常，先停用本模块。启用并更新到 `0.2.0` 后，可删除主配置中的同名手写规则。范围与回退见[直播吧模块说明](docs/zhibo8-adblock.md)。

## 铁路 12306 · 广告过滤（测试版）

通过前置 `DIRECT` 规则覆盖公共去广告规则集对 `ad.12306.cn` 的整域拒绝，再使用 Surge 内置 JQ 删除 `ad.12306.cn/ad/ser/getAdList` 响应中的 `materialsList` 与 `advertParam` 字段，处理开屏及横幅广告。无外部脚本依赖，仅解密 `ad.12306.cn`；刻意不解密购票业务网关 `mobile.12306.cn`，也不处理网关下发的底部资讯流。范围、限制与回退见 [12306 模块说明](docs/12306-adblock.md)。

## 微信公众号与小程序 · 广告过滤（测试版）

公众号模块拦截 `wxs.qq.com`，并对 `mp.weixin.qq.com` 的文章广告、带货商品卡、正文蓝色搜索热词及底部推荐流返回空对象。小程序模块覆盖丰巢、顺丰、中通、EMS、美团扫码点餐、收钱吧、星巴克、麦当劳、猫眼、微信话费充值、充电宝、酒店等常用小程序广告接口，彻底剔除上游的 12 个外部远程脚本、整域空 JSON 规则与 `mobile.12306.cn`。范围与限制见[微信去广告说明](docs/wechat-adblock.md)。

## 滴滴出行 · 广告过滤（测试版）

拦截滴滴广告追踪域名，使用内置 JQ 与 Map Local 清理首页横幅、顺风车/代驾活动弹窗及推荐目的地；合并上游重复 JQ 规则，并取消上游对首页导航栏与个人中心钱包的死板白名单（避免误删钱包余额或正常打车入口）。无外部脚本。范围与回退见[滴滴模块说明](docs/didi-adblock.md)。

## 盒马 · 广告与页面精简（测试版）

使用内置 JQ 与 Map Local 精简盒马首页、底栏 Tab、我的页面及凑单/信息流推荐，修复上游 `Map Local` 遮蔽 `querysinglepage`（逛门店页）JQ 规则的冲突，并为所有 JQ 表达式补齐类型保护。采用场景白名单策略，若部分活动或搜索卡片未显示可停用模块。详见[盒马模块说明](docs/freshippo-adblock.md)。

## YouTube · LLM 翻译字幕（测试版）

连接使用者自己的字幕翻译后端，默认简体中文双语。中文目标下的中文字幕直接放行；只合并完全相同的两行中文字幕，保留时间信息和正常双语。模块自动下载脚本。

后端域名、目标语言和双语开关通过 Surge 参数填写，公开文件不含私人服务地址或密钥。后端会收到字幕请求 URL，并需独立提供兼容的翻译接口；本仓库不提供公共翻译服务。安装时停用旧版 Proxy / Translate 字幕模块，避免重复改写。

固定导入链接（含镜像）、接口约定、数据范围和回退步骤见[翻译字幕说明](docs/youtube-llm-captions.md)。

## YouTube · Premium 解锁面板（测试版）

远程面板模块（`0.1.0`），默认按当前 Surge 分流规则请求 `https://www.youtube.com/premium?hl=en`，无需填写策略名即可开箱即用；也支持在模块参数中指定单个策略组，或以英文逗号分隔最多 4 个策略同卡并发对比。

与本仓库 `CF-AutoRank` 采用一致的正向完整权益校验（确认 `HTTP 200`、唯一有效的 `INNERTUBE_CONTEXT_GL` 地区代码及激活状态的完整 `SPunlimited` `/premium` 购买入口），同时提取公开的个人方案参考月费，并明确区分地区不支持、仅限 Premium Lite、国家无法验证与风控拦截。无需 MITM、无需重写、不携带 Cookie、不修改分流规则。参数与限制见 [YouTube 解锁面板说明](docs/youtube-premium-panel.md)。

## X 模块已删除

X 模块及其专用实现已从当前分支移除，旧 Raw 地址不再提供模块。远端删除不会自动卸载本地副本，已有安装应在 Surge 中手动停用或删除。

X 实验模块存在加载兼容性问题。网页版过滤规则和 App 内修改方案不能直接证明 Surge 对官方 X App 的适用性；本仓库不再提供 X 去广告模块。详见[说明](docs/x-ad-filter.txt)。

## 天气 · 美标 AQI（iRingo）

基于 NSRingo WeatherKit v3.3.2，将默认空气质量算法设为 `WAQI_InstantCast_US`；使用所在位置的污染物数据，按美标 InstantCast 计算 AQI。天气、降水、预警数据源和模块自带规则沿用上游默认值。JS 直接引用官方版本化发布文件，无需本地脚本。

从固定 Raw 地址安装后，停用原 WeatherKit 模块及其他同类天气修复模块，再启用本模块；它是完整替换版，不是叠加补丁。需要既有重写、脚本和 MITM 支持。当前版本已通过配置语法和算法离线验证，手机安装后的完整运行仍需检查，发布不会自动切换设备配置。

安装、数据口径、内置规则范围与验证方法见[美标天气说明](docs/iringo-weather-us.md)。

## 定位 · 地区检测（iRingo）

仅处理 Apple `/pep/gcc` 网络地区检测，默认返回 `US`，使用 NSRingo LocationServices v1.0.1 官方远程脚本。保留单一主机的 DIRECT 规则和 MITM；不启用 Dispatcher 混合处理，不调整地图、天气参数或其他分流。

安装时停用其他处理同一接口的定位模块，确认实际请求返回预期地区后再移除旧本地文件。该网络地区信号不等于 GPS、SIM 或 Apple 账号地区，也不能保证全部地区功能解锁。范围、安装和验证见[定位地区检测说明](docs/iringo-location-service.md)。

## Siri 与聚焦搜索（iRingo）

基于 NSRingo Siri v4.2.7 官方远程脚本，合并 iOS 18+ / macOS 15+ 的 Parsec 搜索接口与 `/bag`、`/card`、`/flight` 接口，默认设定 `CountryCode:US`、`SiriLocale:zh_CN`、`SiriResponseLanguageVariant:zh_CN`，在保持中文 Siri 问答的同时解锁聚焦搜索（Spotlight）、长按“查询（Look Up）”及维基百科知识卡片，并移除上游模板遗留的 `debug=1` 开关。范围与限制见 [Siri 与聚焦搜索说明](docs/iringo-siri-spotlight.md)。

## TestFlight · 区域与通用应用（iRingo）

基于 NSRingo TestFlight v3.4.0 官方远程脚本，将 TestFlight 区域默认改写为 `US` 并开启 `Universal=true` 跨平台通用应用安装支持；同时将 `iosapps.itunes.apple.com` 加入 `skip-proxy` 直连下载测试包。范围与限制见 [TestFlight 模块说明](docs/iringo-testflight.md)。

## 外链中转页 · 自动直跳（测试版）

在 `http-request` 阶段提取并 URL 解码知乎、CSDN、掘金、简书、QQ/QQ邮箱、微博外链中转页的目标参数，校验为合法 `http(s)://` 地址后直接本地返回 `302` 跳转；不含明文 URL 参数时自动放行。因上游 `GetSomeFries` 的微信外链解析存在路径匹配失效与 `eval` 执行风险，本模块不包含 `weixin110.qq.com`。范围与验证见[外链直跳说明](docs/direct-link.md)。

## 哔哩哔哩 · PCDN 节点屏蔽（测试版）

使用 `REJECT-NO-DROP`（立即返回连接拒绝而非静默丢包）拦截 B 站自营 MCDN、302 第三方调度入口、白山云、猫耳 FM 以及派欧云（PPIO 字母表伪装域名池）、臻选云、雾楚云等 77 个 PCDN 域名与关键字，使播放器在 0 毫秒内回退至阿里云/腾讯云等商业主干网备用 CDN（`backup_url`）。已去重并剔除与视频卡顿无关的 `cm.bilibili.com`。纯规则，无需 MITM 或脚本。范围与回退见 [B 站 PCDN 屏蔽说明](docs/bilibili-pcdn-block.md)。

## 目录与维护

```text
modules/   远程发布的 Surge 模块
rules/     远程发布的 Surge 规则集
src/       模块源代码
scripts/   构建脚本，以及 CF-AutoRank.js、Direct-Link.js 等远程运行文件
tests/     各模块自动化检查（CF 测试位于 cf-autorank/）
docs/     模块说明
```

```sh
python3 scripts/build_amap.py --check
python3 tests/test_amap_ad_filter.py
python3 tests/test_douban_splash.py
python3 tests/test_xiaoyuzhou_splash.py
python3 tests/test_xiaoyuzhou_home.py
python3 tests/test_umetrip_adblock.py
python3 tests/test_zhibo8_adblock.py
python3 tests/test_12306_adblock.py
python3 tests/test_wechat_adblock.py
python3 tests/test_didi_adblock.py
python3 tests/test_freshippo_adblock.py
python3 tests/test_alibaba_direct.py
python3 tests/test_wetype_reject.py
python3 tests/test_ai_list.py
python3 tests/test_direct_link.py
python3 tests/test_bilibili_pcdn_block.py
python3 tests/test_iringo_modules.py
python3 scripts/sync_iringo_upstream.py --check
node --check scripts/Direct-Link.js
node --check scripts/VPS-TrafficPanel.js
node --test tests/vps-traffic-panel.test.cjs
node --check scripts/YouTube-Premium-Panel.js
node --test tests/youtube-premium-panel.test.cjs
```

广告模块构建只需 Python 3；规则测试还需 jq 1.7+。`build_amap.py` 生成高德测试版。测试检查 URL 范围、过滤逻辑、保留字段及未知结构兼容，不能替代手机验证。

CF 模块单独使用 Node.js 20+：

```sh
node --test tests/cf-autorank/*.test.cjs
node scripts/build_cf_autorank.cjs --check
node --check scripts/CF-AutoRank.js
```

新增模块使用独立文件和说明，保持远程路径稳定。未实机验证的模块需明确标为测试版，由用户主动选择安装，不自动加入主配置。不要将个人代理配置、Cookie、令牌、证书或私钥放入此公开仓库。

提交身份、通用文档要求及历史同步方式见[维护与隐私](docs/maintenance.md)。

## 参考

- [Surge 模块机制](https://manual.nssurge.com/profile/module.html)
- [Surge JQ Body Rewrite](https://manual.nssurge.com/http/body-rewrite.html)
