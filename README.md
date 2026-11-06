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
| 直播吧 · 广告域名补充 | 0.1.1 · 4 个域名（含 SNI/Host 匹配）及 1 个 IP，无需 MITM，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Zhibo8-AdBlock-Lite.sgmodule) |
| YouTube · LLM 翻译字幕 | 0.1.0 · 自备后端、默认中文双语、重复中文去重，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/YouTube-LLM-Captions.sgmodule) |
| 天气 · 美标 AQI（iRingo） | 0.1.0 · 官方 WeatherKit 远程脚本，美标 InstantCast，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/iRingo-WeatherKit-US.sgmodule) |
| 定位 · 地区检测（iRingo） | 0.1.0 · 官方远程脚本，仅网络地区检测，默认 US，测试版 | [模块 Raw 文件](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/iRingo-LocationService-US.sgmodule) |

## AI 专用域名补充规则集

[AI-Supplement.list 固定地址](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/rules/AI-Supplement.list) 包含 197 条 AI 服务域名规则，用于补充主列表。通过主配置的 `RULE-SET` 引用并指定已有策略组；不在模块页面安装，也不包含节点或脚本。保留局域网、国内 AI 等前置规则及既有分流顺序。由本仓库人工维护，不自动合并上游。安装、范围与来源见 [AI 补充规则说明](docs/ai-supplement.md)。

## VPS 简洁流量面板脚本

[VPS-TrafficPanel.js 固定地址](https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/scripts/VPS-TrafficPanel.js) 支持多个面板共用同一远程脚本，分别传入监控地址、配额、重置日和请求策略。只显示流量、监控请求延时及重置天数，不添加分流规则。私人接口地址保留在本机参数中。引用方式、数据口径和限制见 [VPS 面板说明](docs/vps-traffic-panel.md)。

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

拦截直播吧的广告与统计域名、1 个 IP，以及 `mssdk.volces.com`、`tanx.com` 两个通用 SDK 域名；纯规则，无需 MITM 或脚本。域名规则带 `extended-matching`，App 直接用 IP 连接时也按 SNI / Host 匹配。两个通用 SDK 域名对所有 App 生效，其他 App 出现异常时先停用本模块。`bifen3.qiumibao.com` 与 `img1.360buyimg.com` 可能承载正常内容，刻意不拦截。从主配置迁移时，启用模块后删除主配置中的同名规则。范围与回退见[直播吧模块说明](docs/zhibo8-adblock.md)。

## YouTube · LLM 翻译字幕（测试版）

连接使用者自己的字幕翻译后端，默认简体中文双语。中文目标下的中文字幕直接放行；只合并完全相同的两行中文字幕，保留时间信息和正常双语。模块自动下载脚本。

后端域名、目标语言和双语开关通过 Surge 参数填写，公开文件不含私人服务地址或密钥。后端会收到字幕请求 URL，并需独立提供兼容的翻译接口；本仓库不提供公共翻译服务。安装时停用旧版 Proxy / Translate 字幕模块，避免重复改写。

固定导入链接（含镜像）、接口约定、数据范围和回退步骤见[翻译字幕说明](docs/youtube-llm-captions.md)。

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

## 目录与维护

```text
modules/   远程发布的 Surge 模块
rules/     远程发布的 Surge 规则集
src/       模块源代码
scripts/   构建脚本，以及 CF-AutoRank.js 远程运行文件
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
