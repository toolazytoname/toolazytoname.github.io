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
- **Agnes-2.0-flash** — 聊天在关键词未命中时的可选上游

Node **>= 22.12.0**，见 `package.json` `engines` 和 `.nvmrc`。

---

## 本地开发

```bash
# 1. 安装依赖（必须能直接 npm ci，不要加 --legacy-peer-deps）
npm ci

# 2. 准备环境变量（可选）
cp .env.example .env
# AGNES_API_KEY 只在要用模型时才需要；不填则提供有限的站点问答

# 3. 开发服务器
npm run dev
# → http://127.0.0.1:4321

# 4. 测试 + 生产构建
npm test
npm run build
```

`npm run build` 等于 `astro check && astro build`。类型错误必须让构建失败。

当前 `@astrojs/vercel` 适配器不支持 `astro preview`。本地验证用 `npm run dev`；生产行为用 Vercel 部署或 `npx vercel dev`。完整检查：`npm run ci`。

---

## 获取 API Key

Agnes 是可选项，不是部署前置条件。

1. 打开 [wiki.agnes-ai.com/en/docs/tokenplan.md](https://wiki.agnes-ai.com/en/docs/tokenplan.md)
2. 创建 API key，填到 `.env` 的 `AGNES_API_KEY`

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
7. 环境变量可选：`AGNES_API_KEY`、`PUBLIC_SITE_URL`（默认 `https://www.weichao.ren`）
8. Deploy。无 key 时构建应成功，聊天走静态问答。
9. GitHub Actions 的 `CI` 工作流不会自动拦住 Vercel。若要求检查通过才上生产，在 Vercel Git 设置里打开等待 GitHub check 的开关；详见 [DEPLOY.md](./DEPLOY.md) §1.4。

### 失败排查

| 错误 | 原因 | 修法 |
|---|---|---|
| `npm ci` 失败 | 锁文件与 package.json 不同步，或 Node 版本过低 | 确认 Node 22；在干净目录重跑 `npm ci`，不要用 legacy peer deps 绕过 |
| `astro check` 失败 | 类型错误 | 修类型后再发布。部署入口就是 `npm run build` |
| 主页 404 | Root Directory 配错 | 设为仓库根目录 `./` |
| 聊天只回答站点问答 | 没设 `AGNES_API_KEY`，或模型调用失败 | 检查服务端配置与日志；有 key 的自由对话应调用模型 |

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
