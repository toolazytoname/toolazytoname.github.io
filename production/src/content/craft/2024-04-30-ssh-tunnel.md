---
title: "用 SSH 反向隧道穿透内网"
date: 2024-04-30
summary: "一条命令把家里的 NAS 暴露到公网，绕过所有内网穿透工具。"
tags: ["ssh", "networking", "homelab"]
draft: false
---

家里 NAS 一直想从外面访问，但不想装 frp / Tailscale 之类的额外工具。

SSH 反向隧道可以做到一条命令搞定。

## 服务器要求

一台有公网 IP 的 VPS，能 SSH 登录。我用的是 5 美元的 BandwagonHost。

## NAS 上执行

```bash
ssh -fN -R 10022:localhost:22 user@vps.example.com
```

这会在 VPS 上监听 `10022`，任何连到 `10022` 的连接会被转发回 NAS 的 22 端口。

## 加上 autossh 保活

裸 SSH 容易断。加 autossh：

```bash
autossh -M 20000 -fN -R 10022:localhost:22 user@vps.example.com
```

`20000` 是 autossh 用来检测状态的端口。

## 安全

务必：

- VPS 上把 SSH 改成 key-only 登录
- 10022 端口不要对公网开放，只绑 `127.0.0.1`
- 加防火墙规则限制访问 IP

完工。