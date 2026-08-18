# 观后感 view-impression-app

记录电影、动漫、电视剧观后感的个人应用。输入名称即可自动抓取作品信息（导演/作者、封面、外部评分、集数、简介），再填写自己的评分和评论。

- 数据源：**TMDB**（电影/电视剧）+ **Bangumi**（动漫/日剧）
- 存储：**Vercel Postgres**
- 框架：Next.js 16（App Router）+ Tailwind 4

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

| 变量 | 获取方式 |
| --- | --- |
| `TMDB_API_KEY` | <https://www.themoviedb.org/settings/api> 免费注册申请（v3 API Key） |
| `POSTGRES_URL` | Vercel 项目 → Storage → 创建 Postgres 数据库；本地开发时在 `.env.local` 面板复制连接串 |

数据库表（`works` / `reviews`）会在首次访问时自动创建，无需手动迁移。

## 本地开发

```bash
npm run dev
```

打开 <http://localhost:3000>：首页是观后感列表，「添加」页搜索作品并写观后感，点卡片进入详情页可编辑/删除。

## 部署

推送到 Git 仓库后在 Vercel 导入项目，创建 Postgres 存储并绑定项目（环境变量自动注入），再手动添加 `TMDB_API_KEY` 即可。
