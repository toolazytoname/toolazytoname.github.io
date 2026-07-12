# 部署 + DNS 切换详细步骤

## 1. Vercel 项目

### 1.1 创建项目

1. 登录 https://vercel.com（用 GitHub 账号）
2. 点 **Add New → Project**
3. 选 `toolazytoname/toolazytoname.github.io` 仓库
4. **Framework Preset**: Astro（自动检测）
5. **Root Directory**: `production` ← 代码在子目录
6. **Build Command**: 留空（默认 `astro build`）
7. **Output Directory**: 留空（默认 `dist`）
8. 点 **Deploy**

第一次部署会失败（因为还没设环境变量），正常。先进下一步。

### 1.2 配置环境变量

Vercel 项目 → **Settings → Environment Variables**：

| Name | Value | Environment |
|---|---|---|
| `AGNES_API_KEY` | 你的 Agnes key | Production / Preview / Development |
| `DEEPSEEK_API_KEY` | 你的 DeepSeek key | Production / Preview / Development |

点 **Save**，然后去 **Deployments** 重新部署一次。

### 1.3 配置自定义域名

1. Vercel 项目 → **Settings → Domains**
2. 输入 `weichao.ren` → 点 **Add**
3. Vercel 会给你 DNS 记录，下面会用到
4. 同样添加 `www.weichao.ren`（重定向到根）

---

## 2. DNS 配置

### 2.1 你的域名注册商

如果你用阿里云 / 腾讯云 / Cloudflare / Namecheap，都一样。进去域名解析设置。

### 2.2 添加记录

Vercel 给你的通常是这些记录类型：

#### 根域名 `weichao.ren`

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| A | @ | `76.76.21.21` |
| 或 CNAME | @ | `cname.vercel-dns.com` ← **Cloudflare 专用** |

> 如果你的 DNS 服务商不支持根域名 CNAME（阿里云 DNS 不支持），
> 用 A 记录指向 `76.76.21.21`。

#### `www` 子域名

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| CNAME | www | `cname.vercel-dns.com` |

### 2.3 Cloudflare（如果用）

**推荐用 Cloudflare**，因为：

- 免费 SSL
- 免费 CDN 缓存
- 支持根域名 CNAME（更灵活）

步骤：

1. 在 Cloudflare 添加站点 `weichao.ren`
2. 改域名的 nameservers 为 Cloudflare 提供的（去你原注册商改）
3. 等几分钟生效
4. 在 Cloudflare DNS 添加：
   - CNAME `@` → `cname.vercel-dns.com`（**记得打开代理**橙色的云）
   - CNAME `www` → `cname.vercel-dns.com`
5. 在 Vercel 添加域名，按提示配

### 2.4 等待生效

DNS 传播需要 5-60 分钟。Vercel 会在域名生效后自动签发 SSL 证书。

可以在 https://dnschecker.org 检查 `weichao.ren` 的解析是否生效。

---

## 3. 关闭旧站

新站稳定后（建议观察一周），再去关闭 GitHub Pages：

1. GitHub 仓库 → Settings → Pages
2. Source 选 "None"
3. 保存

旧站 `toolazytoname.github.io` 会返回 404，访问 `weichao.ren` 自动到新站。

---

## 4. 验证清单

部署完后验证：

- [ ] https://weichao.ren 能打开，看到 Hero
- [ ] 3D 地球渲染，4 个点（橘 / 蓝 / 绿 / 黄）可见
- [ ] 拖动地球能旋转
- [ ] 点击点能弹 Lightbox
- [ ] 右下角 FAB 能打开聊天助手
- [ ] 聊天发消息能看到回复 + 来源标签（🟢 Agnes / 🟡 DeepSeek / ⚪ static）
- [ ] /posts /now /about /colophon 都能访问
- [ ] 移动端打开正常（Chrome DevTools → Toggle Device Toolbar）
- [ ] Lighthouse Performance ≥ 85
- [ ] sitemap-index.xml 存在
- [ ] /posts.xml RSS 可订阅

---

## 5. 回滚

如果新站出问题，最快的回滚方式：

1. DNS 改回原 A 记录指向 GitHub Pages 的 IP
   - GitHub Pages A：`185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153`
   - 或保留 Vercel 同时启用 GitHub Pages
2. Vercel → Deployments → 选上一个稳定版本 → 点 "Promote to Production"

---

## 6. 常见问题

**Q: Vercel 域名添加后显示 "Invalid Configuration"？**
A: DNS 没生效。等几分钟，或检查记录值是否正确。

**Q: SSL 证书一直没签发？**
A: Vercel 自动用 Let's Encrypt。如果失败，确认 DNS 已经指向 Vercel 后点 Retry。

**Q: /api/chat 返回 500？**
A: 检查 Vercel Functions 日志。常见原因：API key 没设 / 余额用尽 / 跨区域调用超时。

**Q: 旧博客文章怎么搬？**
A: 旧 Jekyll post 在 `toolazytoname.github.io/_posts/` 下，拷过来改 frontmatter，放到 `src/content/{life,craft}/`。

**Q: 怎么加新文章？**
A: 新建 `src/content/life/2026-XX-XX-xxx.md`，frontmatter 写 `title` / `date` / `summary` / `tags`。会自动出现在 /posts。