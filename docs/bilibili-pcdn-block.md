# 哔哩哔哩 · PCDN 节点屏蔽（测试版）

通过 `REJECT-NO-DROP` 立即拒绝哔哩哔哩（B 站）及旗下猫耳 FM 的家宽众包 PCDN / MCDN 视频流节点，使播放器在毫秒内触发容灾回退，自动切换至播放接口附带的阿里云、腾讯云、华为云等商业主干网备用 CDN（`backup_url`），缓解高速宽带下看 B 站高码率视频卡顿、拖动进度条转圈的问题。纯规则实现，无需 MITM 或脚本。

## 安装

固定远程地址：

```text
https://raw.githubusercontent.com/nuvora-f44c84/surge-modules/main/modules/Bilibili-PCDN-Block.sgmodule
```

在 Surge 模块页面从该地址安装并启用即可。无需开启 MITM 或重写。

## 覆盖范围（共 77 条去重规则）

1. **B 站自营 MCDN 与 302 第三方调度入口（6 条）**：
   - `mcdn.bilivideo.cn`、`mcdn.bilivideo.com`、`ppio.bilivideo.com`、`kodo.bilivideo.com`、`upos-sz-302*.bilivideo.com`、`szbdyd.com`（白山云 PCDN）。
2. **猫耳 FM 音频 PCDN（2 条）**：
   - `solseed.cn`、`solseedr.cn`。
3. **派欧云（PPIO）PCDN 基础设施与字母表伪装节点池（59 条）**：
   - 包含 `ppgslb.com`、`ppiocdn.com`、`ppio.cloud`、`mountaintoys.cn`（覆盖 `edge.mountaintoys.cn`）以及 `abcdefgaijkl.com`、`opqrsduvwxyz.com`、`zyxwvutsrqpo.com` 等派欧云边缘节点域名与 `ourdvsss.com`。
4. **臻选云（湖北）PCDN（7 条）**：
   - `zhenxyun.cn`（已去除社区列表中的重复项）、`zhenxcloud.cn`、`zhenidc.cn`、`zxycdn.cn`、`zhenxuanidc.cn`、`zhenxuancdn.cn`、`zhenxuancloud.com`。
5. **其他 PCDN 关键字（3 条）**：
   - `smogfly`、`wuchuyun`、`wuchucloud`。

## 为什么必须使用 `REJECT-NO-DROP` 并剔除 `cm.bilibili.com`

1. **`REJECT-NO-DROP` vs `REJECT-DROP`**：
   - 若使用 `REJECT-DROP`（静默丢包），B 站播放器会持续等待连接超时（5～10 秒）后才切换备用源，反而导致视频点开时黑屏卡住。
   - 使用 `REJECT-NO-DROP` 会让 Surge 立即向客户端返回连接拒绝（TCP RST / HTTP 502），播放器在 0 毫秒内感知节点不可用并立即切向商业主干网 CDN（`backup_url`）。
2. **剔除 `cm.bilibili.com` 与埋点域名**：
   - 社区原帖（`pastebin.com/cyKBv0qK`）混入了 `cm.bilibili.com`（商业推广 API）和 `data.bilibili.com`、`dataflow.biliapi.com`（遥测埋点）。
   - 埋点域名已由主配置公共去广告规则集处理；而对 `cm.bilibili.com` 直接连接拒绝在部分客户端版本中会导致视频简介下方区块报错，且与视频流缓冲卡顿无关，因此本模块刻意不包含。

## 限制与回退

- 本模块依赖 B 站播放器自身的 `backup_url` 备用源切换机制。极少数冷门远古视频或直播流若服务端仅下发了单一 PCDN 地址而无主干网备用源，拦截后可能无法播放；此时在 Surge 模块页面停用本模块即可立即恢复。
