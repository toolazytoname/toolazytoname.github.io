# 部署 + DNS 切换详细步骤

## 1. Vercel 项目

### 1.1 创建项目

1. 登录 https://vercel.com（用 GitHub 账号）
2. 点 **Add New → Project**
3. 选 `toolazytoname/toolazytoname.github.io` 仓库
4. **Framework Preset**: Astro（自动检测）
5. **Root Directory**: `./`（代码在仓库根目录，没有 `production` 子目录）
6. **Build Command**: `npm run release:check`（官方依赖审计 + 测试、类型检查、构建、URL 和产物校验）
7. **Install Command**: `npm ci`
8. **Node.js Version**: 22.x
9. 点 **Deploy**

无模型 Key 时构建应成功。未指定供应商且无 Key 时，聊天通过服务端提供有限的完整问题匹配，未匹配时明确说明实时对话未开启。有 key 时，所有问题优先结合上下文调用模型；失败才使用明确匹配的站点资料兜底。

### 1.2 配置环境变量

Vercel 项目 → **Settings → Environment Variables**：

| Name | Value | Environment |
|---|---|---|
| `CHAT_PROVIDER` | `openrouter` / `compatible` / `agnes`；留空时优先有 Key 的 OpenRouter，否则 Agnes | Production / Preview / Development |
| `OPENROUTER_API_KEY` | OpenRouter Key；只在服务端使用 | Production / Preview / Development |
| `OPENROUTER_MODELS` | 可选，默认 `google/gemma-4-31b-it:free,openrouter/free`；最多 3 个免费候选 | Production / Preview / Development |
| `LLM_BASE_URL` | `compatible` 模式的 HTTPS 网关地址，包含 `/v1` | Production / Preview / Development |
| `LLM_API_KEY` | `compatible` 模式的网关 Key | Production / Preview / Development |
| `LLM_MODEL` | `compatible` 模式下网关支持的模型或路由名 | Production / Preview / Development |
| `AGNES_API_KEY` | 原 Agnes key（可选，保留兼容） | Production / Preview / Development |
| `PUBLIC_SITE_URL` | `https://www.weichao.ren`（可选，默认就是这个） | Production / Preview / Development |

不要再配置 `DEEPSEEK_API_KEY`，当前代码不使用 DeepSeek。

切换免费模型：设置 `CHAT_PROVIDER=openrouter` 和 `OPENROUTER_API_KEY` 后重新部署。模型候选限制为 `:free` 或 `openrouter/free`，并带零价格上限；路由切换共享 12 秒期限，失败不会回退到 Agnes。显式供应商缺 Key、付费模型 ID 或无效网关地址会记录 `invalid_config`，不发送请求；有精确站点问答时提供标注兜底，否则返回 `model_config_invalid`。

OpenRouter 未购买至少 $10 额度的账户，免费模型总额度为 50 次/天（2026-09-07 核对 [官方 FAQ](https://openrouter.ai/docs/faq)）；所有访客共享这份额度，不能把站点的访客限流当成供应商配额。额度耗尽、模型下线和排队仍会导致失败。自建 FreeLLMAPI 须在独立服务运行，配置自己的供应商 Key 和免费路由，再通过 `compatible` 接入；其计费约束由网关负责。

验收必须包含真实多轮对话：自我介绍、询问本站架构、指出答非所问、未知站主事实。检查返回 `source: ai`（`fallback` 不是模型成功）、答案内容和耗时；同时检查限流、空回复和超时后的提示。没有新供应商 Key 时，只能验证接入与降级，不能宣称已切换上线或改善模型质量。

点 **Save**。若是后加的变量，去 **Deployments** 重新部署一次。

### 1.3 配置自定义域名

1. Vercel 项目 → **Settings → Domains**
2. 添加 `www.weichao.ren` 作为主域
3. 添加 `weichao.ren`，并把它重定向到 `www.weichao.ren`（与当前线上 308 方向一致）
4. 页面 canonical、OG、sitemap、RSS 都使用 `PUBLIC_SITE_URL` / 默认 www 主机

### 1.4 构建门禁与独立安全审计

`vercel.json` 的安装命令为 `npm ci`，构建命令为 **`npm run release:check`**。因此即使 Vercel 不等待 GitHub workflow，测试、类型检查、历史 URL 或站点产物检查失败也会直接令本次构建失败。确认平台控制台没有覆盖仓库里的命令，并从实际部署日志核对执行链。

GitHub Actions 还执行 `npm run audit:deps`，高危及严重漏洞令检查失败；限制仓库读取权限、15 分钟超时，并取消同分支过时的检查。Vercel 同样执行官方依赖审计，高危及以上漏洞或审计网络故障会停止发布，不跳过。GitHub 还安装隔离 Redis 执行原子并发配额验收；分支保护仍需在平台侧设置。

### 1.5 发布后安全与功能冒烟

仓库配置 `nosniff`、严格跨源 Referrer Policy、禁用未使用的相机/麦克风/定位权限，以及 `base-uri 'self'; object-src 'none'; frame-ancestors 'self'`。配套 X-Frame-Options 为 SAMEORIGIN，保留站内 Git 思维导图 iframe。这是 HTTP 基础 CSP。现代 Astro 页面还输出哈希脚本 CSP meta（由发布门禁核对），限制脚本和事件处理器、连接、嵌入和表单；样式属性仍允许，图片允许 HTTPS/data。历史 HTML 附件不改写，因此不宣称全站严格 CSP 或完整 XSS 防护。

发布后实测首页、文章、404 和 `/api/chat/` 的响应头与状态码。本地 Astro 开发服务器和 Python 静态服务器不会模拟 Vercel headers，配置测试通过不等于线上响应头已验证。

```bash
curl -I https://www.weichao.ren/
curl -I https://www.weichao.ren/this-page-must-not-exist/
curl -i https://www.weichao.ren/api/chat/
# GET 聊天接口应返回 405 + Allow: POST + Cache-Control: no-store
```

聊天 Origin 限制不阻挡伪造 HTTP 客户端；进程内限流仅作为请求体读取前的粗筛。生产模型调用在 shared 模式下还受下文共享预约保护；显式 direct 模式直接请求聊天 API，不要求 Redis，也不查询网关管理接口。自托管时必须让可信入口覆盖 `X-Forwarded-For` / `X-Real-IP`，不可直接信任公网客户端传入的代理头。建议另配入口 WAF，并核实模型账户硬预算；shared 模式下 Redis 不可用时不会继续调用模型。

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

- [ ] https://www.weichao.ren 能打开，网名和一句定位在首屏
- [ ] https://weichao.ren 308 到 www
- [ ] `/projects/`、`/posts/`、`/now/`、`/about/` 都能打开
- [ ] 768px 宽时项目卡片标题不被挤成竖列
- [ ] 手机文章页能看到「本文目录」，长文可跳转
- [ ] 右下角 FAB 打开聊天；「有哪些项目」有相关回答；追问「这个网站用什么做的」回答本站架构；乱 JSON 不会 500
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

聊天异常排查：先查看 `/api/chat/` 的响应状态、Content-Type 和 `x-chat-request-id`。HTML 502 表示网关链路异常，不等于模型空回复；`upstream_empty` 才表示模型没有返回有效文本。应用响应均设置 `Cache-Control: no-store`，GET 返回 405。浏览器不会自动重放网络/网关异常请求；仅 413 缩短历史后重试一次，共用 18 秒期限；服务端模型请求 12 秒后中止。有 key 且共享保护允许时才会调用模型，发布前应检查供应商额度与费用预算。

**Q: Vercel 域名添加后显示 "Invalid Configuration"？**
A: DNS 没生效。等几分钟，或检查记录值。

**Q: SSL 证书一直没签发？**
A: 确认 DNS 已指向 Vercel 后在域名设置里点 Retry。

**Q: `/api/chat` 返回 400？**
A: 请求体不合法。合法形状是 `{ messages: [{ role, content }] }`，role 为 user/assistant/system，content 为字符串。

**Q: `/api/chat` 返回 429？**
A: 可能是入口每实例限流、共享 IP 配额或全站调用预算耗尽；检查 JSON error 和 Retry-After。503 + model_protection_unavailable 表示共享存储未配置/故障；不会绕过保护调用模型。

**Q: 旧博客文章怎么搬？**
A: 已经迁到 `src/content/posts/`。`scripts/migrate-posts.py` 是一次性历史脚本，不要当常规工具跑。

**Q: 怎么加新文章？**
A: 新建 `src/content/posts/YYYY-MM-DD-slug.md`，frontmatter 写 `title` / `date` / `categories` / `tags` / `summary`。会自动出现在 `/posts/`。


## 7. 聊天接入方式

### 7.1 直接使用站主中转 API（当前选择）

配置服务端变量 `CHAT_PROVIDER=compatible`、`LLM_BASE_URL=https://litellm.weichao.site/v1`、
`LLM_API_KEY`（站主提供的 Key）、`LLM_MODEL=free`、`CHAT_PROTECTION_MODE=direct`。
应用只调用 `/v1/chat/completions`，不访问管理后台，不检查 `/key/info` 或 `/model/info`，不创建/修改密钥。
无需 `CHAT_REDIS_REST_URL` 或 `CHAT_REDIS_REST_TOKEN`。

保留请求校验、进程内每 IP 每小时 60 次限流、12 秒超时、单次最多 1,024 输出 tokens、错误降级，
但这些**不是分布式限额或金额预算保证**。不根据模型名称承诺中转站实际费用或已设置账户限额。
Vercel Preview/Production 各自配置上述变量后重新部署才生效；不要把 Key 放入 `PUBLIC_` 变量。
本地用 `npm run dev:local`；需要显式重跑真实对话时用
`RUN_LIVE_MODEL_EVAL=1 npm run eval:model:local`（最多 4 次请求，不访问管理 API）。

### 7.2 可选：共享配额上线步骤（仅 shared 模式需要）

1. 选择支持 Redis REST EVAL 的共享服务，在平台服务端环境变量配置 `CHAT_REDIS_REST_URL`（HTTPS）和 `CHAT_REDIS_REST_TOKEN`。Token 不进入 PUBLIC_ 变量、URL、日志或浏览器。
2. `CHAT_PROTECTION_MODE=shared`（生产默认）。生产禁止 local；未配置存储时发布仍可提供静态站和 FAQ，但**不会开启实时模型**。
3. 配置 `CHAT_GUARD_NAMESPACE`：生产所有实例/部署/供应商共用稳定值，例如 `weichao-production`。Preview 使用另一个命名空间/数据库/供应商 Key；不要通过更换命名空间或清空数据库重置账期配额。
4. 可调整 `CHAT_MODEL_IP_HOURLY=60`、`CHAT_MODEL_DAILY=40`、`CHAT_MODEL_MONTHLY=1000`、`CHAT_MODEL_CONCURRENCY=3`。全部必须为正整数；错误配置失败关闭。
5. 默认是从首次预约起算的固定 1h / 24h / 30d 窗口，**不是自然日/月，也不是严格滑动窗口**。窗口边界会允许短时间跨窗口的两份额度。请求体先验证，静态 FAQ 不消耗模型配额；正常实时 FAQ 仍会消耗。
6. Lua 用 Redis TIME 原子检查并预约：IP（IPv6 按 /64 聚合，存储 HMAC 标识，不存原始 IP）、全局次数和在途租约。所有 keys 使用相同 cluster hash tag。失败/超时不退回次数，避免重复计费；Redis 不可用/2s 超时/响应不合法则拒绝调用。
7. 模型超时 12s；租约 30s，finally 主动释放，崩溃可过期恢复。只能限制应用预约，无法保证供应商收到取消后停止其后台计算。每天/每月上限仍约束调用总量。
8. 这是**次数预算**。最大输出 1,024 tokens/次；输入随请求长度变化，不保证具体金额。供应商硬预算、独立 Preview Key、Key 轮换、WAF 和告警仍由运维配置。不要把高并发测试对着付费模型运行。

验收工具：

```bash
# 本地 Redis 隔离 Unix socket，检查原子并发/额度、释放、崩溃过期，不访问真实共享数据库
npm run verify:guard
# 真实部署（GET 页面、404/旧跳转/订阅，以及无效 JSON、超大请求；不触发模型）
npm run verify:release -- --base=https://部署域名
# 受保护的 Vercel Preview 使用已登录 CLI，不关闭部署保护
npm run verify:release -- --base=https://预览域名 --vercel
# 在受控环境读取服务端模型配置，最多 4 次请求，失败停止；合成对话写 .audit/model-eval.json
RUN_LIVE_MODEL_EVAL=1 npm run eval:model
```

脚本的 `--output=路径` 可保留发布冒烟证据。CLI 模式不向参数传入 bypass secret；普通 HTTP 模式可通过服务端环境变量 `RELEASE_BYPASS_TOKEN` 发送，不记录其值。

### 当前验收边界（2026-10-02）

本地真实 Redis 已验证原子预约；没有共享服务凭据，未宣称真实跨区域 REST 服务已接通。
早先 Agnes 实测第二轮 HTTP 429；后续站主提供的 LiteLLM `free` 四轮真实对话通过（`litellm-model-eval.json`）。这是合成样本检查，不是长期稳定性或全面质量保证。
2026-10-02 已发布并将正式域名切换到 `dpl_Le1yA7WEVuakvnnf3joKNJURdKDR`，使用 direct 模式与 LiteLLM `free`。上线前及正式域名各 15 项 HTTP 检查通过，正式页面聊天实测返回 AI 回答。发布证据见 `docs/audits/2026-10-02/production-release.json`。
Chromium 分页打印 PDF 和本地 Lighthouse 已补测；真机、读屏软件、系统打印对话框和生产用户性能数据仍需对应环境。详见 `docs/FOLLOWUP-2026-10-02.md`。
