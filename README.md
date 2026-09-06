# weichao.ren · 重建

韦超（lazy / 小兔头）的个人站。**Astro 7 + Vercel + TypeScript strict**。

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
# AGNES_API_KEY 只在要用模型时才需要；不填则走静态问答

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

不填 key 也可以：聊天先走本地关键词，未命中时返回明确兜底，不会因此导致构建失败。

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
| 聊天只回答静态内容 | 没设 `AGNES_API_KEY`，或问题被关键词命中 | 这是预期降级，不是 offline |

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
