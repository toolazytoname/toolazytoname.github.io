# weichao.ren · 重建

lazy 的个人站。**Astro 7 + Vercel + TypeScript strict**。

旧站：[toolazytoname.github.io](https://toolazytoname.github.io)（Jekyll）

线上：**[https://www.weichao.ren](https://www.weichao.ren)**（apex `weichao.ren` 308 到 www）

---

## 技术栈

- **Astro 7** — 页面框架、Content Collections、静态生成
- **React 19** — AI 聊天助手交互岛
- **Vite 8.2.1** — 显式与 Astro / React 插件对齐，避免测试依赖提升出 Vite 6 导致开发环境 Fast Refresh 崩溃
- **Vercel** — 托管 + Serverless Functions + CDN
- **TypeScript** — strict 模式，路径别名 `@components / @data / @lib`
- **OpenAI-compatible API** — 可选 OpenRouter 免费模型、自建网关或原 Agnes；结合站点资料与对话历史回答

Node **22.x（>= 22.12.0）**，npm **10.9.8**，见 `package.json` `engines` 和 `.nvmrc`。

---

## 本地开发

```bash
# 1. 安装依赖（必须能直接 npm ci，不要加 --legacy-peer-deps）
npm ci

# 2. 准备环境变量（可选）
cp .env.example .env
# 模型 Key 只在要用实时对话时才需要；不填则提供有限的站点问答

# 3. 开发服务器
NODE_OPTIONS=--env-file=.env npm run dev
# → http://127.0.0.1:4321

# 4. 测试 + 生产构建
npm test
npm run build
```

`npm run build` 等于 `astro check && astro build`。类型错误必须让构建失败。

聊天在运行时读取 `process.env`；上述 Node 参数让本地开发也加载 `.env`。不使用模型、也未创建 `.env` 时可直接 `npm run dev`。Vercel 使用项目中配置的服务端环境变量。

当前 `@astrojs/vercel` 适配器不支持 `astro preview`。本地验证用 `npm run dev`；生产行为用 Vercel 部署或 `npx vercel dev`。完整检查：`npm run ci`；依赖安全审计：`npm run audit:deps`（显式使用 npm 官方 registry，避免镜像不支持 advisory API）。

---

## 配置聊天模型

模型是可选项，不是部署前置条件。推荐先试 OpenRouter 免费模型：

1. 在 [OpenRouter](https://openrouter.ai/settings/keys) 创建 Key，填入服务端的 `OPENROUTER_API_KEY`。
2. 设置 `CHAT_PROVIDER=openrouter`。默认依次尝试 `google/gemma-4-31b-it:free`、`openrouter/free`；可用 `OPENROUTER_MODELS` 调整，逗号分隔，最多 3 个。
3. 发布后实测“介绍下你自己 → 你这个网站是用什么做的 → 你着牛头不对马嘴啊”，确认身份、网站技术栈和纠错均正确，并记录耗时。测试通过仅代表接入逻辑正确，不代表真实回答质量已验收。

OpenRouter 配置只接受 `:free` 模型或 `openrouter/free`，请求另带输入、输出及每次请求价格上限 0；不会失败后调用付费模型或 Agnes。网关负责候选模型切换，所有候选共享本站 12 秒期限。`openrouter/free` 随机选择可用免费模型，回答风格与质量可能变化。默认模型在 2026-09-07 的官方目录中可用且输入/输出价格为 0，尚需使用自己的 Key 实测。

按 [OpenRouter FAQ](https://openrouter.ai/docs/faq)（2026-09-07 核对），未购买至少 $10 额度的账户，免费模型合计限 50 次/天；购买后为 1,000 次/天。免费模型仍可能限流、排队或下线，不提供本站可用性保证。

也可以接 [FreeLLMAPI](https://github.com/tashfeenahmed/freellmapi) 这类自建网关：设置 `CHAT_PROVIDER=compatible`、`LLM_BASE_URL=https://你的网关/v1`、`LLM_API_KEY` 和网关支持的 `LLM_MODEL`。它需要单独运行并配置供应商 Key；免费路由与预算由网关管理，本站无法替任意兼容网关保证零费用。公网地址必须 HTTPS，HTTP 仅限本机开发；Vercel 上的 localhost 不会指向你的电脑。FreeLLMAPI 作者将项目定位为个人实验，不建议把免费额度当作稳定生产服务。

未设置 `CHAT_PROVIDER` 时，有 OpenRouter Key 就选 OpenRouter，否则沿用 `AGNES_API_KEY`。显式选择供应商后，缺 Key 或配置错误不会偷偷改用另一家。所有 Key 仅配置在服务端。

每条消息都会连同历史发送到服务端。有 key 且共享保护允许时优先调用模型，根据本站资料和上下文回答；无 key 时仅匹配完整的常见问题，不把包含关键词的自由对话替换成模板。模型失败时，能明确匹配的问答会标注为备用答复，其余问题保留可重试错误，不会因此导致构建失败。

本站架构资料维护在 `src/data/knowledge.ts`；模型同时读取项目与最新近况数据。网关 HTML、无效 JSON 或网络失败只提供手动重试，不自动重放可能已计费的请求；仅明确的 413 拒绝会缩减历史后重试一次。总等待限制在 18 秒内；模型单次请求上限 12 秒。服务端日志仅记录错误类型、状态和请求 ID，不记录对话正文。

---

## Vercel 部署

### 第一次

1. Vercel → **Add New → Project** → 导入 `toolazytoname/toolazytoname.github.io`
2. **Branch**: `master`
3. **Root Directory**: `./`（仓库根目录，没有 `production` 子目录）
4. **Framework**: Astro
5. **Build Command / Install Command**: 以 `vercel.json` 为准（`npm run release:check` / `npm ci`）
6. **Node.js Version**: 22.x
7. 环境变量：按上文配置可选聊天模型；`PUBLIC_SITE_URL` 默认 `https://www.weichao.ren`
8. Deploy。无 key 时构建应成功，聊天走静态问答。
9. Vercel 构建执行 `npm run release:check`（官方依赖审计 + 完整 CI）；GitHub Actions 另跑真实 Redis 原子配额集成测试。详见 [DEPLOY.md](./DEPLOY.md) §1.4。

### 失败排查

| 错误 | 原因 | 修法 |
|---|---|---|
| `npm ci` 失败 | 锁文件与 package.json 不同步，或 Node 版本过低 | 确认 Node 22；在干净目录重跑 `npm ci`，不要用 legacy peer deps 绕过 |
| `astro check` 失败 | 类型错误 | 修类型后再发布。部署入口就是 `npm run build` |
| 主页 404 | Root Directory 配错 | 设为仓库根目录 `./` |
| 聊天只回答站点问答 | 没设所选模型的 Key，或模型调用失败 | 检查 `CHAT_PROVIDER`、对应 Key 与日志；`invalid_config` 表示配置有误 |

域名、DNS、回滚见 [DEPLOY.md](./DEPLOY.md)。

---

## 项目结构

```
.
├── astro.config.mjs
├── package.json
├── vercel.json
├── .env.example
├── public/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/                # index / about / now / posts / projects / api/chat
│   ├── content/posts/        # 全部文章（新文章也放这里）
│   ├── data/                 # projects / knowledge / now / personal
│   ├── lib/                  # llm / chat-request / rate-limit / seo / permalink
│   └── styles/global.css
└── README.md
```

---

## 内容

首页采用统一的 `--max-w-home` 阅读宽度，首个精选项目重点展示，其余项目并列；手机自动切为单列。项目截图完整呈现，二维码保持原色。聊天入口使用低干扰的中性表面，正文阅读宽度仍由 `--max-w-narrow` 独立控制。

导航右侧的太阳/月亮按钮切换日间、夜间模式。首次访问跟随系统，手动选择保存在浏览器 `localStorage` 的 `site-theme` 中，刷新、跨页和同源标签页保持一致；存储不可用时仍可切换当前页面。颜色统一维护在 `src/styles/global.css`，首屏主题由 `ThemeInit.astro` 在正文渲染前设置。图片、二维码和代码高亮保留原色。

历史文章在 `src/content/posts/`。新增文章也放这里，frontmatter 需要：

```yaml
title: 标题
date: 2026-09-06T12:00:00+08:00
categories: life
tags:
  - example
summary: 一两句说明解决了什么问题、适用什么条件。
```

`summary` 对新文章是内容要求。改 slug / 分类 / 日期前先核对旧 URL。

---

## 常用检查

```bash
npm test              # 单元测试
npm run build         # 类型检查 + 生产构建
npm run verify:urls   # 永久链接与（若已构建）产物核对
npm run ci            # 上面三项一起跑
```

---

## License

Code: MIT. Content (文章 / 照片): CC BY-NC-SA 4.0.


## 质量门禁与检索（2026-10-02）

- `npm run ci`：单元测试 → Astro 类型检查与生产构建 → 冻结文章 URL / 重定向校验 → 构建产物完整性校验。
- `npm run verify:site`：检查所有输出 HTML 的站内链接、资源、锚点；现代页面还检查主标题、main、语言、description、canonical、JSON-LD、图片 alt 与不安全嵌入。4 个明确列举的历史 HTML 附件只豁免现代页面结构要求，不豁免链接检查。脚本含负向测试，不只检查当前样本。
- 所有 `/_astro/*.js` 按文件 gzip 的合计预算为 **150 KiB**，包括按需加载的聊天 React 运行时；不是首屏传输量或 Lighthouse 分数。
- 文章搜索支持标题、摘要、标签、全部分类，空格分词取交集；NFKC 归一化支持全角拉丁字母。`/posts/?q=资源&category=ios` 可分享并恢复筛选，不为每个键入增加历史记录。无 JS 时保留完整按年归档，不显示无效的搜索控件。原始文章日期与 URL 不变，首页日期统一按 UTC 显示。
- 聊天仅接受同源浏览器 JSON 请求；无 Origin 的服务端请求仍可调用。请求体有字节上限及 5 秒读取期限，路由返回不缓存，其他方法通过框架 Origin 检查后返回 405；跨源表单可能更早由 Astro 返回 403。Origin 检查不是身份认证。
- 限流仍是**单进程**每 IP 每小时 60 次，最多保留 10,000 个活跃桶，满容量拒绝新桶。多实例与冷启动会重置/分散计数，不能作为付费模型的全站预算保证。需要公共服务等级保证时应在入口配置分布式配额/WAF，并在供应商侧设置硬预算。
- 日志不记录完整访客对话；聊天框明确提示消息可能发送给模型供应商。浏览器关闭面板不会取消正在处理的回复；组件卸载时中止本地请求。

详见 [本轮检查记录](./docs/HEALTHCHECK-2026-10-02.md)。


## 聊天直连与可选共享保护

当前接入按站主要求使用 LiteLLM 的聊天 API，不登录中转站、不查询或管理密钥。
服务端 `.env` 配置如下（Key 使用实际值，不提交仓库）：

```dotenv
CHAT_PROVIDER=compatible
LLM_BASE_URL=https://litellm.weichao.site/v1
LLM_API_KEY=你的服务端Key
LLM_MODEL=free
CHAT_PROTECTION_MODE=direct
```

`direct` 不需要 Redis，保留输入校验、单进程 IP 限流、12 秒模型超时及输出长度限制；
**不提供跨实例调用次数或金额预算保证**，也不验证中转站账户配额。
本地启动用 `npm run dev:local`，显式以项目 `.env` 覆盖同名 shell 变量，避免 URL 与 Key 错配。
Vercel 使用平台服务端环境变量，不运行本地 `.env` 包装器；修改环境变量后需重新部署才生效。

需要额外分布式限额时可选 `CHAT_PROTECTION_MODE=shared`，再配置
`CHAT_REDIS_REST_URL`、`CHAT_REDIS_REST_TOKEN`。此模式缺配置/存储故障会停止模型调用。
未设置模式时生产默认 `shared`、开发默认 `local`；生产禁止 `local`。
共享配额为调用次数而非金额预算，详见 [DEPLOY.md](./DEPLOY.md)。

```bash
npm run release:check                  # 联网依赖审计 + 全部可重复构建检查
npm run verify:guard                   # 真实本地 Redis 并发验收；需 redis-server / redis-cli
npm run verify:release -- --base=https://目标部署
# Vercel 登录后可检查有部署保护的 Preview，不需要暴露 bypass token：
npm run verify:release -- --base=https://目标预览 --vercel
npm run audit:links                    # 构建产物所有外链只读检测；默认 .audit/external-links.json
# 显式许可最多 4 次真实供应商请求；遇到失败立即停止，不属于 CI：
RUN_LIVE_MODEL_EVAL=1 npm run eval:model:local
```

`src/data/external-link-health.json` 是带日期的 HTTP 404/410 快照，不代表项目下线或仓库不存在。
项目页暂停展示确认不可达的可点击入口；历史文章仅在编译结果标注检查日期，原始 Markdown 与 URL 不变。
复查恢复可访问后移除相应记录；403/429/超时只能标为待复核，不能自动删链接。

Astro 页面使用哈希 `script-src` CSP，拒绝未授权内联脚本及事件处理器；允许 style 属性以保留动态布局。
主题初始化脚本单独注册精确哈希。历史 HTML 附件未改写，仍只受平台基础安全头保护。
`verify:site` 会检查实际输出的 CSP、内联脚本哈希、链接、语义和 JS 预算。

首页响应式截图使用 `src/assets/projects/` 中的现有截图副本，由 Astro/Sharp 在构建时生成 360/640/960 宽度 WebP；保留 `public/projects/` 原始文件及旧公开地址。无需运行时图片代理。
