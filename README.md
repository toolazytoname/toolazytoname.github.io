# weichao.ren · 重建

lazy 的个人站。**Astro 7 + Vercel + TypeScript strict**。

旧站：[toolazytoname.github.io](https://toolazytoname.github.io)（Jekyll）

线上：**[https://www.weichao.ren](https://www.weichao.ren)**（apex `weichao.ren` 308 到 www）

---

## 技术栈

- **Astro 7** — 页面框架、Content Collections、静态生成
- **React 19** — AI 聊天助手交互岛
- **Vercel** — 托管 + Serverless Functions + CDN
- **TypeScript** — strict 模式，路径别名 `@components / @data / @lib`
- **OpenAI-compatible API** — 可选 OpenRouter 免费模型、自建网关或原 Agnes；结合站点资料与对话历史回答

Node **>= 22.12.0**，见 `package.json` `engines` 和 `.nvmrc`。

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

当前 `@astrojs/vercel` 适配器不支持 `astro preview`。本地验证用 `npm run dev`；生产行为用 Vercel 部署或 `npx vercel dev`。完整检查：`npm run ci`。

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

每条消息都会连同历史发送到服务端。有 key 时优先调用模型，根据本站资料和上下文回答；无 key 时仅匹配完整的常见问题，不把包含关键词的自由对话替换成模板。模型失败时，能明确匹配的问答会标注为备用答复，其余问题保留可重试错误，不会因此导致构建失败。

本站架构资料维护在 `src/data/knowledge.ts`；模型同时读取项目与最新近况数据。遇到网关 HTML 或无效 JSON，前端最多自动重试一次，总等待限制在 18 秒内；模型单次请求上限 12 秒，有效的模型错误不会自动重复调用模型。服务端日志仅记录错误类型、状态和请求 ID，不记录对话正文。

---

## Vercel 部署

### 第一次

1. Vercel → **Add New → Project** → 导入 `toolazytoname/toolazytoname.github.io`
2. **Branch**: `master`
3. **Root Directory**: `./`（仓库根目录，没有 `production` 子目录）
4. **Framework**: Astro
5. **Build Command / Install Command**: 以 `vercel.json` 为准（`npm run build` / `npm ci`）
6. **Node.js Version**: 22.x
7. 环境变量：按上文配置可选聊天模型；`PUBLIC_SITE_URL` 默认 `https://www.weichao.ren`
8. Deploy。无 key 时构建应成功，聊天走静态问答。
9. GitHub Actions 的 `CI` 工作流不会自动拦住 Vercel。若要求检查通过才上生产，在 Vercel Git 设置里打开等待 GitHub check 的开关；详见 [DEPLOY.md](./DEPLOY.md) §1.4。

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
