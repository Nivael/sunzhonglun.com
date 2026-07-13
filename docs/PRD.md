# PRD — sunzhonglun.com 个人网站

> 本文档是本项目的唯一需求源。不在 PRD 里的功能，先改 PRD 再动手。
> 每个版本完成后，更新对应章节的状态标记，并在 CLAUDE.md「迭代记录」追加一条。

- **状态标记**：⬜ 未开始 · 🔨 进行中 · ✅ 已完成
- **最后更新**：2026-07-13

---

## 1. 产品定位

Zhonglun 的个人 portfolio 网站 + 写作存档：

- **是什么**：收录 92 篇过往微信公众号文章、之后的新写作、视频作品的个人站，同时作为对外展示自己的 portfolio 门面。
- **给谁看**：对我感兴趣的读者、潜在合作者、朋友。
- **核心体验**：极简高级的阅读体验（现有设计基因），加上足以承担 portfolio 职能的信息架构（导航、侧栏、自我介绍）。
- **长期原则**：内容为主，工程轻量，不引入不必要的依赖；所有迭代落文档。

## 2. 现状（2026-07-13）

- Astro 5 静态站已就绪（v0 基础站，2026-07-12 从 Python 生成器迁移完成）
- 内容：2 篇示例占位文章 + 关于页
- 设计：Medium 式极简，单栏 44rem，无侧栏，顶栏只有 文章/关于/主题切换
- ~~未部署，无远程仓库（纯本地 git），域名未购买~~ → 2026-07-13：GitHub 公开仓库
  [Nivael/sunzhonglun.com](https://github.com/Nivael/sunzhonglun.com) 已建并推送；Vercel 已部署；
  域名 sunzhonglun.blog 已购，DNS 记录待在 Cloudflare 添加（见 §4.3）

---

## 3. 版本路线图

版本号规则见 §9。按依赖关系排序，**先上线、再填内容、再升级设计**——尽早部署可以让每一步的效果都在真实环境验证。

| 版本 | 内容 | 状态 |
|------|------|------|
| v0 | Astro 迁移（基础站） | ✅ 2026-07-12 |
| v1.0 | 上线：GitHub 仓库 + Vercel 部署 + 域名 + 基础 SEO | ✅ 2026-07-13 |
| v1.1 | 公众号文章迁移（实际 76 篇，见 §5） | ✅ 2026-07-13 |
| v1.2 | 设计升级：portfolio 化（顶栏 + 侧栏 + 新首页） | ⬜ |
| v1.3 | 视频页 | ⬜ |
| v2.x | 之后再规划（见 §10 非目标里的候选） | — |

---

## 4. v1.0 上线（域名 + 部署）

### 4.1 GitHub 仓库

- **公开**仓库（用户已确认，GitHub 账号 Nivael），推送现有历史。
- 推送时把默认分支从 `master` 更名为 `main`（一次性，与协作规则 §8 对齐）。

### 4.2 域名购买

- **正式域名：`sunzhonglun.blog`**（2026-07-13 已在 Cloudflare Registrar 购入）。
- 原属意的 `sunzhonglun.com`（用户早年注册后过期释放）已于 2025-07-01 被抢注
  （注册商 Cloud Yuqu LLC，NS 停放在 domain-expired 页，2027-07 到期）——
  属于域名商人待售状态，将来可在聚名/西部数码等交易平台尝试回购，回购成功后再做 301 迁移，
  站点架构上只需改 site.json 与 astro.config 各一行。
- 站点部署在海外（Vercel），**不需要 ICP 备案**。

### 4.3 Vercel 部署

- 免费版足够：静态站、全球 CDN、git push 自动部署。
- 配置：Framework = Astro（自动识别），构建命令 `npm run build`，输出 `dist/`。（2026-07-13 已部署）
- 域名绑定：`sunzhonglun.blog` 与 `www.sunzhonglun.blog`，在 Cloudflare DNS 各加一条 CNAME
  指向 Vercel 提供的目标值，**代理关闭（灰云 DNS only）**。主域名与 www 的重定向方向在 Vercel
  Domains 里配置，取裸域为主。
- 预览环境：每个 PR 自动生成 preview URL，作为设计/内容改动的验收入口。

### 4.4 基础 SEO 与站点设施

- `@astrojs/sitemap` 生成 sitemap.xml（这是「必要依赖」，允许引入）
- 每页 Open Graph / Twitter Card meta（标题、描述、类型）
- favicon（简单文字或首字母即可，不必等设计升级）
- 404 页面（复用 Base 布局）
- `robots.txt`
- 访问统计：**暂缓**，列入 §10 候选（保持零脚本负担；上了 Vercel 可先用其自带 Analytics 免费档）

### 4.5 验收标准

- [x] https://sunzhonglun.blog 可访问，HTTPS 正常（2026-07-13 验证 200）
- [x] push 到 main 后自动部署成功
- [x] feed.xml、sitemap.xml、robots.txt、favicon、404、OG meta 就绪
- [ ] 跳转方向翻转：目前是裸域 308 → www，需在 Vercel Domains 里改为 www → 裸域
  （canonical/sitemap/OG 均按裸域生成，保持一致）——**用户在 Vercel 点一下 Edit 即可**
- [ ] Google Search Console 提交收录（用户操作，可选、不阻塞）
- [ ] Lighthouse 移动端 Performance ≥ 95（待测，不阻塞）

---

## 5. v1.1 公众号文章迁移（92 篇）

### 5.1 方案

采用 **computer use（Claude in Chrome）爬取**为主的混合方案：

1. **首选直接抓取**：公众号文章的永久链接（`mp.weixin.qq.com/s/...`）通常无需登录即可访问，先用脚本直接 fetch 正文 HTML——快、可批量、可重跑。
2. **computer use 兜底**：遇到验证页、需要登录、或滚动加载图片的文章，用 Claude in Chrome 打开真实浏览器读取渲染后的页面。
3. 两条路径产出统一的中间格式（正文 HTML + 元数据），走同一套 HTML → markdown 转换。

### 5.2 流水线

```
URL 清单 (92 条)
  → 抓取正文 HTML + 标题 + 原发布日期
  → 清洗公众号私有标记（多层 section 嵌套、内联样式、data-* 属性）
  → 转 markdown（保留加粗/引用/列表/分隔线/代码）
  → 下载图片到 public/assets/images/<slug>/（请求头带 Referer: https://mp.weixin.qq.com/，绕防盗链）
  → 图片引用改写为 /assets/images/<slug>/xx.jpg
  → 写入 content/posts/YYYY-MM-DD-<slug>.md
  → 本地渲染人工校对
```

### 5.3 执行节奏

| 阶段 | 内容 | 验收 |
|------|------|------|
| 阶段 0 | 导出 92 篇清单，**每篇含：URL + 标题 + 原发表时间**，存 `docs/migration/articles.json`。方式：用户在后台「发表记录」页控制台运行 `docs/migration/fetch-articles.js`（Claude 扩展安全策略不允许访问 mp.weixin.qq.com，已验证，浏览器自动化路线不可行） | 清单齐、无重复、每篇都有发表时间 |
| 阶段 1 | 试点 3 篇（挑图多的、带引用的、纯文字的各一篇），人工逐篇校对 | 排版无破损，转换规则定稿 |
| 阶段 2 | 批量迁移，每批约 10 篇，进度记录在 `docs/migration/checklist.md`（每篇：URL / slug / 状态 / 备注） | 每批构建通过 + 抽查 |
| 阶段 3 | 全量校对收尾：日期、excerpt、slug 统一检查；删除 2 篇示例文章 | 92 篇全绿 |

### 5.4 元数据规则

- `date`：用公众号**原发布日期**，保持写作时间线真实
- `slug`：**英文语义短语**（用户已确认），小写连字符（如 `reading-notes`），迁移时逐篇定
- `quote`：**原文中最美的一句**，由 Claude 通读全文挑选，原样引用不改写——
  首页列表的预览位展示（衬线体 + 「」引号）
- `excerpt`：**一句话 trailer**，像预告片一样告诉读者这是一个关于什么的故事，
  由 Claude 撰写，不剧透——首页列表次行展示，并用于 og:description 与 RSS 摘要
- 文首不加"最初发布于公众号"注（试点阶段决定：保持正文干净）

### 5.5 验收标准

（总数修正：实际未删除文章 **76 篇**——后台"93"为发表记录数，含已删文章、无文章的群发，
以及 1 条重复记录：idx 31 与 idx 30 为同一篇《银河之一日》的两条发表记录）

- [x] 76 篇全部在新站正常渲染，图片全部本地化，无任何 `mp.weixin.qq.com` 资源依赖
- [x] 校对：用户已在 PR #2 审阅并合并
- [x] RSS 与首页列表按日期正确排序，构建时间可接受
- [x] 追加：每篇配 quote（原文最美一句，逐字校验）与 excerpt（一句话 trailer），见 §5.4

---

## 6. v1.2 设计升级（portfolio 化）

### 6.1 原则

**升级不推翻。** 现有设计基因（衬线正文、44rem 阅读版心、配色变量、全部微交互，见 CLAUDE.md「设计规范」）原样保留；升级的是**信息架构**，不是阅读体验。

### 6.2 参考站点（审美基准）

| 站点 | 借鉴点 |
|------|--------|
| brianlovin.com | 经典左侧 sidebar 双栏布局，导航/社交/分组清晰 |
| paco.me | 极简克制，留白与字体层级 |
| rauno.me | 微交互质感（craft 页尤其） |
| antfu.me | 开发者 portfolio 首页的自我介绍 + 内容混排 |
| leerob.com | 顶栏 + 内容型个人站的信息组织 |

落地前先出一版设计说明（布局草图 + 各断点行为），确认后再写码。

### 6.2.5 内容分类（2026-07-13 用户确认）

文章分四类：**Jazz / Portrait / Sketch / 文**。前三类由标题自动识别（标题含
"Jazz"、"Portrait"、"Sketch"，含 June Portrait 等变体），其余归入"文"。
分类由构建时从标题推导（`src/lib/posts.ts`），**不加 frontmatter 字段**——
数据结构上让错误不可能发生：标题即分类，无需手工维护第二份真相。
展示：侧栏分类导航 + 分类归档页（`/category/<slug>/`），首页列表在 meta 行显示分类。
侧栏分类区走大间距留白（条目间距约 1.15rem、字距微调），整体气质偏森系日系的安静疏朗。
设计草图（用户已过一轮意见）：https://claude.ai/code/artifact/5c9ea2da-0a4b-493b-a7e1-fa81b372829d

### 6.3 范围

- **顶栏**：Logo + 导航（文章 / 视频 / 关于）+ 主题切换；滚动时 sticky（是否毛玻璃背景，设计稿阶段定）
- **侧栏**（桌面端 ≥ 1080px 左侧固定）：头像、一句话简介 **"I write."**、导航、联系方式仅邮箱
  **zhonglunsun@gmail.com**（不放社交链接，用户已确认）、按年份的文章归档入口；窄屏折叠回顶栏
- **新首页**：hero 仅一句 **"Hi there, I'm Zhonglun, and I write."**（无副标题、无统计数字——内容持续更新，不做静态描述）+ 最新文章列表。
  **精选区暂缓**（2026-07-13 用户决定，未来要做时再回到本节）
- **文章页**：保持 44rem 阅读版心不变，侧栏在文章页收敛（或仅留窄导航），确保阅读零干扰
- **全站检查**：light/dark 两套、移动端、`prefers-reduced-motion`

### 6.4 验收标准

- [ ] 桌面/移动端截图走查（真实浏览器），两种主题各一遍
- [ ] 现有微交互全部仍在（进度条、渐现、hover 下划线、主题切换旋转）
- [ ] Lighthouse 不低于升级前

---

## 7. v1.3 视频页

- 新增 `videos` content collection：frontmatter 含 `title` / `date` / `platform`（bilibili | youtube）/ `id`（BV 号或 YouTube ID）/ 可选 `description`
- 视频页为卡片列表，点击展开内嵌播放器（B 站 iframe / YouTube embed），**懒加载**——默认只渲染封面图，点击才加载 iframe，保住加载性能
- 顶栏「视频」导航入口在 v1.2 已预留
- 具体交互到时候再细化，本节先占位

---

## 8. 协作规则

- **PRD 驱动**：功能不在 PRD 里就先改 PRD；产品决策变化（如砍掉某功能）也要回写 PRD，避免"undocumented 决策被推翻"。
- **分支与合并**：
  - 工程改动（代码、样式、结构）：`feature/*` 分支 → PR（GitHub 上线后走真 PR + Vercel preview 验收）→ merge 到 `main`
  - 纯内容更新（新文章、改错字）：可直接提交 `main`，不必开分支
- **提交信息**：中文，说清做了什么和为什么
- **每次迭代收尾三件事**：① CLAUDE.md「迭代记录」追加一条；② PRD 对应版本状态更新；③ 受影响的文档章节同步（结构 / 命令 / 待办）
- **验收方式**：用户在 dev server 或 Vercel preview 上过目后合并；纯文档改动可直接合并

## 9. 版本规则

- 版本号 `vX.Y`：**Y** = 路线图里的一次功能迭代（如 v1.1 内容迁移），**X** = 大改版（信息架构或技术栈级别的变化）
- 每个版本合并后打 **git tag**（如 `v1.0`），tag message 一句话概述
- CLAUDE.md「迭代记录」即 changelog，不另设 CHANGELOG 文件
- `dist/` 永不入库，构建交给 Vercel

## 10. 非目标（明确暂不做）

以下有意不做，避免范围膨胀；未来若要做，先回到本节把它移出去：

- 评论系统（可考虑的最轻方案是 giscus，v2 再议）
- 后台 CMS / 在线编辑（markdown + git 就是编辑器）
- 多语言 / 英文版
- Newsletter / 邮件订阅（RSS 已覆盖订阅需求）
- 全文搜索（92 篇量级下按年归档 + 浏览器查找够用，v2 再议）
- 访问统计（候选：Vercel Analytics 免费档，v1.0 之后看需要）

## 11. 开放问题

已答复（2026-07-13）：

| # | 问题 | 答复 |
|---|------|------|
| 1 | 仓库公开还是私有 | **公开**（GitHub 账号 Nivael） |
| 2 | 域名注册商 | **Cloudflare**，购买由用户操作 |
| 3 | 92 篇 URL 清单来源 | 公众号后台发表记录页，用户保持登录态，Claude 浏览器扩展爬取 |
| 4 | slug 风格 | **英文语义** |
| 5 | 侧栏信息 | 无社交链接；邮箱 zhonglunsun@gmail.com；简介 "I write." |

仍待定：

| # | 问题 | 阻塞哪个版本 |
|---|------|--------------|
| 6 | 精选文章挑哪几篇（等 92 篇迁入后再挑） | v1.2 |
| 7 | 头像图素材 | v1.2 |
