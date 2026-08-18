# 观后感 view-impression-app

记录电影、番剧、电视剧观后感的个人应用。输入名称即可自动抓取作品信息（导演/作者、封面、外部评分、集数、类型、主演/声优），再填写自己的评分和评论。

- 数据源：**TMDB**（电影/电视剧）+ **Bangumi**（番剧/日剧）
- 存储：**Vercel Postgres**
- 权限：**谷歌账号登录**，仅站长可写，访客只读
- 框架：Next.js 16（App Router）+ Tailwind 4

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

| 变量 | 获取方式 |
| --- | --- |
| `TMDB_API_KEY` | <https://www.themoviedb.org/settings/api> 免费注册申请（v3 Key 或 v4 Token 均可，自动识别） |
| `POSTGRES_URL` | Vercel 项目 → Storage → 创建 Postgres 数据库；本地开发时在 `.env.local` 面板复制连接串 |
| `AUTH_SECRET` | 运行 `openssl rand -base64 32` 生成随机密钥 |
| `AUTH_GOOGLE_ID` | 见下方「配置谷歌登录」 |
| `AUTH_GOOGLE_SECRET` | 见下方「配置谷歌登录」 |
| `OWNER_EMAIL` | 站长的谷歌邮箱，只有它能登录并进行写操作 |
| `HTTPS_PROXY` | （可选）本机代理，如 `http://127.0.0.1:7897`；浏览器走代理上网时服务端也需要 |

数据库表（`works` / `reviews`）会在首次访问时自动创建，无需手动迁移。

## 配置谷歌登录

应用使用 Auth.js（NextAuth v5）+ Google OAuth，只有 `OWNER_EMAIL` 指定的账号能登录，其他人保持匿名访客（只读）。

1. 打开 [Google Cloud Console](https://console.cloud.google.com)，新建一个项目（名称随意）。
2. 左侧菜单进入 **APIs & Services → OAuth consent screen**：
   - User Type 选 **External**，填写应用名称和你的邮箱；
   - 测试阶段把你的谷歌邮箱加入 **Test users**（或直接发布为 Production）。
3. 进入 **Credentials → Create Credentials → OAuth client ID**：
   - Application type 选 **Web application**；
   - **Authorized redirect URIs** 添加两条：
     - `http://localhost:3000/api/auth/callback/google`（本地开发）
     - `https://你的vercel域名/api/auth/callback/google`（线上，部署后再补）
4. 创建后复制 **Client ID** 和 **Client Secret**，分别填入 `AUTH_GOOGLE_ID` 和 `AUTH_GOOGLE_SECRET`。
5. 重启 `npm run dev`，点首页右上角「谷歌账号登录」验证：站长邮箱可以登录，其他账号会被拒绝。

> 注意：OAuth 回调域名必须和实际访问域名完全一致（含 http/https 与端口），更换域名后记得回 Google Cloud Console 补充回调 URI。

## 本地开发

```bash
npm run dev
```

打开 <http://localhost:3000>：

- **访客**：浏览首页观后感列表（大类型/小类型/评分/观看年份筛选）、查看详情，全部只读；
- **站长登录后**：右上角出现「+ 添加」，可搜索作品并写观后感，详情页可编辑/删除，首页卡片悬停可快速删除。

## 部署

1. 推送到 Git 仓库后在 Vercel 导入项目；
2. 创建 Postgres 存储并绑定项目（`POSTGRES_URL` 自动注入）；
3. 手动添加其余环境变量：`TMDB_API_KEY`、`AUTH_SECRET`、`AUTH_GOOGLE_ID`、`AUTH_GOOGLE_SECRET`、`OWNER_EMAIL`（**不要**在 Vercel 上配 `HTTPS_PROXY`）；
4. 部署完成后，把线上回调地址 `https://你的vercel域名/api/auth/callback/google` 补进 Google Cloud Console（见上文第 3 步）。
