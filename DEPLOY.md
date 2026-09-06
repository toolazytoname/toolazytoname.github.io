# 部署 + DNS 切换详细步骤

## 1. Vercel 项目

### 1.1 创建项目

1. 登录 https://vercel.com（用 GitHub 账号）
2. 点 **Add New → Project**
3. 选 `toolazytoname/toolazytoname.github.io` 仓库
4. **Framework Preset**: Astro（自动检测）
5. **Root Directory**: `./`（代码在仓库根目录，没有 `production` 子目录）
6. **Build Command**: `npm run build`（即 `astro check && astro build`）
7. **Install Command**: `npm ci`
8. **Node.js Version**: 22.x
9. 点 **Deploy**

无 `AGNES_API_KEY` 时构建应成功。聊天走本地关键词 / 兜底，不会因为缺 key 而失败。

### 1.2 配置环境变量

Vercel 项目 → **Settings → Environment Variables**：

| Name | Value | Environment |
|---|---|---|
| `AGNES_API_KEY` | 你的 Agnes key（可选） | Production / Preview / Development |
| `PUBLIC_SITE_URL` | `https://www.weichao.ren`（可选，默认就是这个） | Production / Preview / Development |

不要再配置 `DEEPSEEK_API_KEY`，当前代码不使用 DeepSeek。

点 **Save**。若是后加的变量，去 **Deployments** 重新部署一次。

### 1.3 配置自定义域名

1. Vercel 项目 → **Settings → Domains**
2. 添加 `www.weichao.ren` 作为主域
3. 添加 `weichao.ren`，并把它重定向到 `www.weichao.ren`（与当前线上 308 方向一致）
4. 页面 canonical、OG、sitemap、RSS 都使用 `PUBLIC_SITE_URL` / 默认 www 主机

### 1.4 GitHub CI 不是默认发布门禁

仓库里的 GitHub Actions（`.github/workflows/ci.yml`）会在 `master` 推送和 PR 上跑 `npm run ci`（test + build + URL 校验）。Vercel 部署是另一条线：它只执行 `vercel.json` 里的 `npm ci` 和 `npm run build`，**默认不会等 GitHub 检查通过**。

如果要求「CI 不通过不发布」，需要在 Vercel 项目里单独打开：

1. **Settings → Git → Ignored Build Step** 或 Deployment Protection
2. 把 Production 部署设为等待 GitHub `CI / check` 通过，或只允许成功的 workflow 触发生产部署

本仓库看不到线上 Vercel 开关的实际状态。发布前请在 Vercel 控制台确认一次，不要只凭仓库配置假设已经门禁。

---

## 2. DNS 配置

### 2.1 域名注册商

阿里云 / 腾讯云 / Cloudflare / Namecheap 均可。进入域名解析设置。

### 2.2 添加记录

#### 根域名 `weichao.ren`

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| A | @ | `76.76.21.21` |
| 或 CNAME | @ | `cname.vercel-dns.com` ← **Cloudflare 专用** |

> 如果 DNS 服务商不支持根域名 CNAME（阿里云 DNS 不支持），用 A 记录指向 `76.76.21.21`。

#### `www` 子域名

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| CNAME | www | `cname.vercel-dns.com` |

### 2.3 Cloudflare（如果用）

1. 在 Cloudflare 添加站点 `weichao.ren`
2. 改域名的 nameservers 为 Cloudflare 提供的
3. DNS：
   - CNAME `@` → `cname.vercel-dns.com`
   - CNAME `www` → `cname.vercel-dns.com`
4. 在 Vercel 添加域名，按提示配

### 2.4 等待生效

DNS 传播通常 5–60 分钟。Vercel 会在域名生效后自动签发 SSL。可在 https://dnschecker.org 检查解析。

---

## 3. 旧 github.io 地址

自定义域切到 Vercel 之后，**不要假设关掉 GitHub Pages 也没关系**。仓库里仍有指向 `toolazytoname.github.io` 的历史外链和项目 demo。

保留策略：

1. GitHub Pages 继续为 `toolazytoname.github.io` 提供按路径可访问的入口（至少项目文档和旧外链）。
2. 个人站正文走 `www.weichao.ren`。
3. 只有确认没有任何需要保留的 github.io 路径之后，才关闭 Pages。

---

## 4. 验证清单

部署完后验证：

- [ ] https://www.weichao.ren 能打开，姓名和一句定位在首屏
- [ ] https://weichao.ren 308 到 www
- [ ] `/projects/`、`/posts/`、`/now/`、`/about/` 都能打开
- [ ] 768px 宽时项目卡片标题不被挤成竖列
- [ ] 手机文章页能看到「本文目录」，长文可跳转
- [ ] 右下角 FAB 打开聊天；「有哪些项目」有静态回答；乱 JSON 不会 500
- [ ] Escape 关闭聊天后焦点回到按钮；移动菜单 Escape 可关
- [ ] `/posts.xml` 和 `/feed.xml` 都能订阅
- [ ] `sitemap-index.xml` 存在
- [ ] 文章分享图 PNG 正常（中文标题抽查一篇）

---

## 5. 回滚

优先用已有的稳定 Vercel 部署回滚：

1. Vercel → Deployments → 选上一个稳定版本 → **Promote to Production**

只有在确认 GitHub Pages 仍能提供可接受的旧站时，才把 DNS 改回 GitHub Pages：

- GitHub Pages A：`185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153`

不要把「改回旧 DNS」当成一定可用的快速回滚。

---

## 6. 常见问题

**Q: Vercel 域名添加后显示 "Invalid Configuration"？**
A: DNS 没生效。等几分钟，或检查记录值。

**Q: SSL 证书一直没签发？**
A: 确认 DNS 已指向 Vercel 后在域名设置里点 Retry。

**Q: `/api/chat` 返回 400？**
A: 请求体不合法。合法形状是 `{ messages: [{ role, content }] }`，role 为 user/assistant/system，content 为字符串。

**Q: `/api/chat` 返回 429？**
A: 单实例内存限流，每 IP 每小时 60 次。前端应显示可重试，而不是「我不知道」。

**Q: 旧博客文章怎么搬？**
A: 已经迁到 `src/content/posts/`。`scripts/migrate-posts.py` 是一次性历史脚本，不要当常规工具跑。

**Q: 怎么加新文章？**
A: 新建 `src/content/posts/YYYY-MM-DD-slug.md`，frontmatter 写 `title` / `date` / `categories` / `tags` / `summary`。会自动出现在 `/posts/`。
