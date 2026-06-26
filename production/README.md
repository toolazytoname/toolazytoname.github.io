# weichao.ren · 重建

韦超（小兔头）的个人站重建。**Astro 5 + Vercel + TypeScript strict**。

旧站：[toolazytoname.github.io](https://toolazytoname.github.io)（Jekyll，14 年）

新站部署目标：**[weichao.ren](https://weichao.ren)**

---

## 技术栈

- **Astro 5** — 页面框架、Content Collections、静态生成
- **React 19** — 交互岛（3D 地球 / AI 聊天助手）
- **Three.js** — Hero 的 3D 地球
- **Vercel** — 托管 + Serverless Functions + CDN
- **TypeScript** — strict 模式，路径别名 `@components / @data / @lib`
- **Gemini 1.5 Flash** — 聊天机器人首选
- **DeepSeek** — 聊天机器人兜底

---

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 准备环境变量
cp .env.example .env
# 然后填入 GEMINI_API_KEY 和 DEEPSEEK_API_KEY

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

### Gemini API Key（主）

1. 打开 [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. 登录 Google 账号
3. 点 "Create API key"
4. 复制 key 填到 `.env` 的 `GEMINI_API_KEY`

免费层配额：每分钟 15 次请求，每天 1500 次。对个人站绰绰有余。

### DeepSeek API Key（备用）

1. 打开 [platform.deepseek.com](https://platform.deepseek.com)
2. 注册 / 登录
3. 进入 "API Keys" → "Create new secret key"
4. 复制 key 填到 `.env` 的 `DEEPSEEK_API_KEY`

DeepSeek 价格：每百万 token ¥1-2，非常便宜。

> **两个 key 都不填也行** —— 聊天机器人会自动 fallback 到本地静态问答。

---

## Vercel 部署

### 第一次

1. 把代码推到 GitHub（已经推到 `rebuild/ip-xiaotutou` 分支的 `production/` 目录）
2. 登录 [vercel.com](https://vercel.com)
3. 点 "Add New Project" → 选 GitHub 仓库
4. **Framework Preset**: 选 "Other"
5. **Root Directory**: 填 `production`（如果代码在仓库的子目录）
6. **Build Command**: `npm run build`
7. **Output Directory**: 留空（由 Vercel 自动识别 Astro）
8. **Install Command**: `npm install`

### 配置环境变量

Vercel 项目设置 → Environment Variables：

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | 你的 Gemini key |
| `DEEPSEEK_API_KEY` | 你的 DeepSeek key |

每个环境（Production / Preview / Development）都可以分别配。

### 配置自定义域名

详见 [DEPLOY.md](./DEPLOY.md)。

---

## 项目结构

```
production/
├── astro.config.mjs
├── package.json
├── vercel.json
├── .env.example
├── public/
│   ├── photos/               # 4 张照片（站主自己换）
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/           # Nav / Footer / Hero / Globe / Chatbot ...
│   ├── layouts/              # BaseLayout / PostLayout
│   ├── pages/                # index / now / about / colophon / 404 / posts
│   │   └── api/chat.ts       # Vercel serverless function
│   ├── content/              # Astro Content Collections (life / craft)
│   ├── data/                 # memories / works / now / knowledge
│   ├── lib/                  # llm / rate-limit / seo
│   └── styles/global.css
└── README.md
```

---

## 内容迁移

旧 Jekyll 站 56 篇文章，目前 sample 放了 5 篇（实际是 2 篇）：
- `src/content/life/2023-01-21-sushi.md`
- `src/content/craft/2024-04-30-ssh-tunnel.md`

迁移时把旧 `.md` 放到 `src/content/life/` 或 `src/content/craft/`，
frontmatter 加 `title` / `date` / `summary` / `tags` 即可。

---

## 替换照片

把 4 张照片（400×400 推荐，更大也行）放到 `public/photos/`：

- `beijing.jpg`
- `xinjiang.jpg`
- `hainan.jpg`
- `guangxi.jpg`

文件名要严格匹配 `src/data/memories.ts` 里的 `photo` 字段。

---

## 下一步

站主需要做的：

1. ☐ 获取 Gemini + DeepSeek API key，填到 Vercel 环境变量
2. ☐ 把 4 张照片放到 `public/photos/`
3. ☐ 把旧博客文章搬过来（src/content/{life,craft}/）
4. ☐ 配 DNS（详见 DEPLOY.md）
5. ☐ 验收

---

## License

Code: MIT. Content (文章 / 照片): CC BY-NC-SA 4.0.