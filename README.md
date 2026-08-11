# weichao.ren · 重建

韦超（小兔头）的个人站重建。**Astro 5 + Vercel + TypeScript strict**。

旧站：[toolazytoname.github.io](https://toolazytoname.github.io)（Jekyll，14 年）

新站部署目标：**[weichao.ren](https://weichao.ren)**

---

## 技术栈

- **Astro 5** — 页面框架、Content Collections、静态生成
- **React 19** — AI 聊天助手交互岛
- **Vercel** — 托管 + Serverless Functions + CDN
- **TypeScript** — strict 模式，路径别名 `@components / @data / @lib`
- **Agnes-2.0-flash** — 聊天机器人首选

---

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 准备环境变量
cp .env.example .env
# 然后填入 AGNES_API_KEY

# 3. 跑开发服务器
npm run dev
# → http://localhost:4321

# 4. 生产构建 + 本地预览
npm run build
npm run preview
# → http://localhost:4321
```

---

## 获取 API Key

### Agnes API Key（主）

1. 打开 [wiki.agnes-ai.com/en/docs/tokenplan.md](https://wiki.agnes-ai.com/en/docs/tokenplan.md)
2. 注册 / 登录 Agnes 账号
3. 创建一个 API key
4. 复制 key 填到 `.env` 的 `AGNES_API_KEY`

免费层配额：每分钟 20 次请求。对个人站绰绰有余。

> 不填 key 也可以，聊天机器人会自动使用本地静态问答。

---

## Vercel 部署

### 第一次

**Vercel 是按页面顺序一步步配置的，不是单页表单。** 你会看到 3-4 个页面：

#### 页面 1：选择 GitHub 仓库（Add New Project 入口）

登录 https://vercel.com → 点 **Add New → Project** → 在 GitHub repo 列表里找到 `toolazytoname/toolazytoname.github.io` → 点 **Import**。

#### 页面 2：项目命名 + 团队

- **Project Name**: 填 `weichao-ren`（或 `toolazytoname-github-io`，跟图里一样）
- **Vercel Team**: 选 "toolazytoname's projects" Hobby
- 点右下角 **Continue** / **Next**

> 这一页**没有**分支选择 + Root Directory 配置，别在这一页找。

#### 页面 3：分支选择 + 构建配置（关键）

你会看到：

```
Branch:        [master ▼]              ← 这里下拉
Framework:     [Astro ▼]
Root Directory: ./    [Edit]           ← 默认 ./，点 Edit 改
Build Command:  [npm run build]
Output Dir:     [dist]
Install Cmd:    [npm install]
```

**关键操作**：

1. **Branch 下拉** → 选 **`master`**
2. **Root Directory** → 保持默认 `./`（代码就在仓库根目录）
3. **Framework Preset**: 选 **Astro**（自动检测）
4. 其他**留默认**（Build / Output / Install 都已写在 `vercel.json` 和 `package.json`）

#### 页面 4：环境变量（可选，可后加）

点 "Environment Variables" 折叠面板，添加：

| Name | Value | Environments |
|---|---|---|
| `AGNES_API_KEY` | 你的 Agnes key | Production + Preview + Development |

> 也可以**先不填，直接 Deploy**。Vercel 会 build 成功（chatbot 显示降级），deploy 完再回来设环境变量 + Redeploy。

#### 点 Deploy

第一次 build 大约 1-3 分钟（npm install 安装 Astro、React 和 OpenAI SDK）。

#### Build 失败的常见原因 + 修法

| 错误 | 原因 | 修法 |
|---|---|---|
| `Build script returned non-zero exit code: 1` | Root Directory 错了 / 依赖装不上 | 确认 Root Directory = `./`；Vercel → Settings → Node Version = 20 |
| 404 / 主页空白 | 函数没部署 | 检查 vercel.json `functions` 配置 |
| Chatbot 一直显示 offline | 没设环境变量 | 在 Settings → Environment Variables 加 `AGNES_API_KEY` + Redeploy |

`master` 就是当前 Astro 5 站点的部署分支。Vercel 部署哪个分支，就构建哪个分支的代码。

### 配置环境变量

Vercel 项目设置 → Environment Variables：

| Name | Value |
|---|---|
| `AGNES_API_KEY` | 你的 Agnes key |

每个环境（Production / Preview / Development）都可以分别配。

### 配置自定义域名

详见 [DEPLOY.md](./DEPLOY.md)。

---

## 项目结构

```
.
├── astro.config.mjs
├── package.json
├── vercel.json
├── .env.example
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/           # Nav / Footer / Hero / Chatbot ...
│   ├── layouts/              # BaseLayout / PostLayout
│   ├── pages/                # index / about / 404 / posts / projects
│   │   └── api/chat.ts       # Vercel serverless function
│   ├── content/              # Astro Content Collections (posts)
│   ├── data/                 # projects / knowledge
│   ├── lib/                  # llm / rate-limit / seo
│   └── styles/global.css
└── README.md
```

---

## 内容迁移

61 篇历史文章已迁入 `src/content/posts/`。新增文章使用同一目录，并提供
`title`、`date`、`categories`、`summary` 和 `tags` 等 frontmatter。

---

## 下一步

站主需要做的：

1. ☐ 获取 Agnes API key，填到 Vercel 环境变量
2. ☐ 定期更新 Projects 页的项目状态、截图和 star 数
3. ☐ 配 DNS（详见 DEPLOY.md）
4. ☐ 验收

---

## License

Code: MIT. Content (文章 / 照片): CC BY-NC-SA 4.0.

---
