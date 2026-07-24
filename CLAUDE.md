# sunzhonglun.com — 个人博客

## 项目背景

Zhonglun 的个人 portfolio 网站 + 写作存档，收录 92 篇过往微信公众号文章 + 之后的新写作，后续加视频页。
站点基于 **Astro 5** 静态生成（`output: 'static'`），部署在 Vercel，域名 **sunzhonglun.blog**
（原属意的 sunzhonglun.com 已被他人持有，见 PRD §4.2；本地目录与 GitHub 仓库名仍叫 sunzhonglun.com，勿混淆）。

**需求与路线图见 [docs/PRD.md](docs/PRD.md)**——它是唯一需求源，功能不在 PRD 里先改 PRD 再动手；
协作规则、版本规则也在 PRD §8/§9。

## 结构

```
content/posts/        文章，markdown，文件名 YYYY-MM-DD-slug.md
content/posts-en/     完成的英文译稿，与中文源稿同名配对
content/about.md      关于页
content/about-en.md   英文关于页
public/assets/images/ 文章图片（原样拷贝，路径固定）
src/styles/global.css 全站样式（经 Astro 打包，产出内容哈希文件名）
src/scripts/main.js   交互脚本（经 Astro 打包内联）
src/content.config.ts 内容集合定义（glob loader 指向 content/，复用现有 frontmatter）
src/layouts/Base.astro 页面骨架（sidebar=true 时为侧栏双栏形态，默认极简顶栏）
src/components/       Header / Footer / ThemeToggle / LanguageSwitch / Sidebar / PostList / PostListEnglish
src/pages/            中文路由 + en/ 英文路由 + feed.xml.ts
src/lib/posts.ts      阅读时长、摘要、slug、日期格式、分类推导（categoryFromTitle）
tests/                vitest 单元测试（npm test）
api/visit.ts          访问统计 serverless 函数（Vercel 根 api/，不经 Astro 构建，见 PRD §7.5）
site.json             站点标题、简介、域名
astro.config.mjs      关闭 Shiki 高亮与 smartypants（保持排版口径，勿开）
```

文章 frontmatter 约定：`title`、`date`（YYYY-MM-DD）、可选 `excerpt`、`slug`、`cover`。
URL slug = frontmatter `slug`，否则文件名去掉日期前缀。
`cover` 仅用于未把公众号题图放进正文的旧稿列表封面，不会渲染进文章页；
列表封面优先取 `cover`，否则构建时推导正文首图。
正文图片放 `public/assets/images/`，正文里写 `/assets/images/...`。
英文译稿 frontmatter 只写 `title`、`quote`、`excerpt`，不重复写 date/slug；
日期、slug、分类、封面均从同名中文源稿取得。翻译口径见 `docs/translation-guide.md`。
当前共 77 篇中文文章（迁入 76 篇 + 新作《去创造》）。

## 常用命令

```
npm run dev       开发预览（localhost:4321）
npm run build     构建到 dist/（已 gitignore）
npm run preview   预览构建产物
npm test          单元测试（vitest，覆盖 src/lib/posts.ts）
```

## 设计规范（改动时必须保留）

风格：Medium 式极简 + 精致微交互。所有样式见 `src/styles/global.css`，交互见 `src/scripts/main.js`。

- 版心 44rem；正文衬线字体（Source Serif 4 / Georgia / Songti SC / Noto Serif SC），字号 1.15rem，行高 2.05，letter-spacing .012em；UI 与标题用系统无衬线（PingFang SC 等）
- 配色：浅色 bg #fff、正文 rgba(0,0,0,.84)、强调色 #147d64；深色 bg #121212、强调色 #4cc2a4。全部走 CSS 变量，`[data-theme="dark"]` 切换
- 交互细节（都要保留）：
  - 深色模式：跟随系统 + 手动切换，localStorage 记忆，head 内联脚本防闪白（Base.astro 中必须 `is:inline`）
  - 文章页顶部 2px 阅读进度条（scaleX）
  - 滚动渐现（IntersectionObserver + .reveal，尊重 prefers-reduced-motion）
  - 首页文章标题 hover 下划线从左向右生长动效
  - 页面加载淡入、主题切换按钮 hover 旋转
- 中文排版优先：引用块左侧竖线、分隔线短居中、图片圆角居中
- v1.5 杂志化（首页/分类页，文章页不涉及）：报刊式 masthead（细线夹注元信息行 + 大字 hero + 粗细双线）；
  最新一篇通栏题图（21/9，≤820px 4/3，首图自动轮换）+ 7/5 双栏编辑排版标题区；
  两栏网格（≥1360px 三栏，≤820px 单栏），封面 = 可选 `cover` 题图优先、正文首图后备
  （`coverImage` 构建时推导），两者都没有时以 quote 排版块（.card-plate）代位
- v1.5 滚动特效：题图视差（main.js rAF，位移 = 图高 12%，reduced-motion 不启用）；
  封面/字卡 clip-path 滚动显影（随 .reveal 触发）
- v1.5 来访量露出：页脚 .foot-stats 与侧栏 .side-stats 同源填充（main.js 一次请求两处），
  手机端可见
- v1.6 英文阅读页沿用 44rem 版心，英文正文行高 1.78；`/en/` 保留杂志首页，
  只展示已完成的逐篇译稿
- v1.6 双语页面的 PC / 平板使用 `中文 / EN` 双选项 tab；≤540px 改为顶栏内单一目标语言
  文字入口（`EN` / `中`），不另占一行，同时隐藏与站名链接重复的 `文章 / Writing`

## 关键实现细节

- **markdown 渲染口径**：`astro.config.mjs` 里 `syntaxHighlight: false`、`smartypants: false`。
  前者保证代码块只走 style.css 的 pre/code 样式，后者避免正文标点被替换。
  开启任意一个都会改变现有排版效果。
- **日期时区**：frontmatter 日期按 UTC 解析，`src/lib/posts.ts` 里全部用 `getUTC*` 取值，
  避免东八区下日期偏移一天。
- **英文译稿配对**：`content/posts-en/` 与 `content/posts/` 以完整文件 id 配对；
  英文稿不得写 date/slug，孤立译稿会中止构建。新中文文章默认同轮逐篇翻译，
  `tests/translation-backlog.json` 只登记明确欠稿；未登记的新稿缺少英文版会令测试失败。
  质量流程见 `docs/translation-guide.md`，不得接运行时机翻 API 或提交半成品。
- **双语 SEO**：只有存在对应页面时才显示语言入口并输出双向 hreflang；
  未翻译文章保持纯中文 canonical，不生成空英文页。
- **轻量 i18n**：当前语言由路由前缀、同名内容集合配对和 Base 的 `lang` / `alternatePath`
  统一确定；只有中英双语且正文为独立 Markdown，不引入运行时字典或完整 i18n 依赖。
  增加第三种语言或大量共用 UI 文案时再抽统一路由、字典与 fallback 模块。
- **RSS**（`src/pages/feed.xml.ts`）：手写 XML，格式与旧站 feed.xml 逐字节等价
  （pubDate 固定 `+0800`），不引入 @astrojs/rss 依赖。
- **CSS/JS 必须走 Astro 打包，不能放 public/ 固定路径**：Vercel 对静态资源发
  `max-age=31536000, immutable`，固定路径会让老访客永远拿到旧文件（v1.2 上线时踩过：
  返回访客的首页侧栏裸奔）。打包后文件名含内容哈希，每次部署自动失效。
  **测试线上改版效果时也务必硬刷新或无痕窗口。**

## 待办

见 [docs/PRD.md](docs/PRD.md) §3 版本路线图。当前：**v1.5 杂志化改版**与
**v1.6 英文版**均已合并上线；英文版 77/77 篇存量译稿完成，翻译 backlog 清零，今后新增
中文稿默认同轮完成四遍校订的英文译稿。v1.4 访问统计线上数字待观察，下一项为 v1.3 视频页。

## 迭代记录

- **2026-07-24 v1.6 移动端语言入口重设计**：PC / 平板保留 `中文 / EN` 双选项，
  手机端移除另占一行的胶囊页签，改为顶栏内只显示目标语言的轻量文字入口。
  移动端站名已返回文章首页，因此同步隐藏重复的 `文章 / Writing`，中英文顶栏保持单行。
  PRD 记录轻量 i18n 架构边界；28 项测试、164 页构建通过，真实 Chrome 覆盖
  320 / 390 / 768 / 1440px、深色主题、双向跳转与读屏名称。

- **2026-07-23 v1.6 语言切换 tab**：将原单文字语言入口升级为克制的 `中文 / EN` 双选项组件，
  当前语言以选中态和 `aria-current` 标识。≥1080px 常驻页面右上，窄屏进入顶栏，
  ≤540px 独立换行右对齐；侧栏不再重复显示入口，无对应译文的页面仍不显示。
  28 项测试、164 页构建通过；真实 Chrome 覆盖 320–1440px、深色主题、双向跳转与键盘焦点。

- **2026-07-23 v1.5 旧稿题图补全**：定位《玫瑰与花园》及更早 24 篇旧稿无列表题图，
  原因是迁移器只抓正文 `js_content`，未保存公众号 `og:image`，而这些文章正文恰好没有插图。
  从本地 HTML 缓存恢复并本地化 24 张原始题图，新增可选 `cover` 元数据与 `coverImage`
  （显式题图优先、正文首图后备），中英文首页共同继承，文章阅读页不插入封面。
  增加可重复执行的 `recover-covers.py`；26 项测试、构建及桌面/390px 浏览器验收通过。

- **2026-07-23 v1.6 英文版（存量翻译完成，77/77）**：新增独立 `posts-en` 内容集合、`/en/` 首页、
  `/en/about/` 与 `/en/posts/<slug>/` 静态路由；中英文页面仅在确有对应稿时显示语言切换，
  并输出 canonical / 双向 hreflang。英文稿复用中文源稿的日期、slug、分类与封面，
  无运行时 AI、无新增依赖。建立 `docs/translation-guide.md` 四遍校订口径，并逐篇完成
  《去创造》英译样稿。真实浏览器验收桌面/390px 移动端、深色主题和未翻译文章降级；
  测试与构建通过。用户已确认样稿声音；其余 76 篇均逐篇完成四遍校订，backlog 清零；
  《Old Angel》因源稿正文原本即为作者英文，保留原文作为原生英文声音参照。PR #8 合并后
  Vercel 生产部署完成；正式域名批量验收 77 个英文文章 URL 全部返回 200，运行时错误为 0。

- **2026-07-22 v1.5 杂志化改版（已验收上线）**：用户从四个候选参考中选定
  Gritty Culture Blog（杂志网格）+ Miranda（报刊编辑排版）混合方向，PRD 新增 §7.6。
  首页/分类页改为 masthead + 通栏题图 + 网格混排（52 篇图卡 + 24 篇字卡），
  `firstImage` 从正文推导封面（vitest 覆盖），文章阅读页零改动，未新增依赖。
  一轮截图验收后按用户反馈追加二轮：题图视差 + 封面显影 + 页脚来访量（复用 §7.5 接口，
  解决侧栏统计手机端不可见；曾评估 Vercount，弃）。惯性平滑滚动评估后落选。
  落选参考留作灵感：Stripe Press 3D 书架 → 未来精选区；Nature Visual Essay → 未来图片特稿单页。
  历史备注：本版曾因本地基线滞后暂占 v1.4 编号，合流时更正为 v1.5。

- **2026-07-19 v1.4 访问统计（PR #5 已合并 2026-07-21）**：侧栏展示 总来访/今日（UV，人）与
  总浏览/今日（PV，次）。`api/visit.ts`（Vercel 根 api/ serverless，零依赖直调 Upstash Redis
  REST pipeline）+ main.js 每页上报（localStorage 当日去重，上报成功才写标记）。仅生产环境计数
  （preview/bot 只读），无 Redis 环境变量时静默降级、统计区隐藏。日期口径东八区
  （`src/lib/visits.ts`，vitest 覆盖边界）。分支 feature/visit-counter（基于 fix/asset-cache-busting）。
  2026-07-19 已推送并开 PR #5；Upstash Redis 已在 Vercel 开通（upstash-kv-rose-river，iad1，Free 档）
  并 Connect 到项目（Production + Preview，注入 `KV_REST_API_*` 变量）。待用户：审阅合并 PR #5。

- **2026-07-13 v1.2 portfolio 化**：左侧栏（首页/分类页，≥1080px）+ 四分类
  （Jazz/Portrait/Sketch/文，标题推导，vitest 覆盖）+ 新 hero
  （"Hi there, I'm Zhonglun, and I write."）+ 分类归档页与 /categories/ 总览。
  文章页阅读版心零改动。精选区暂缓（PRD §6.3）。侧栏「视频」入口待 v1.3 上线时加。
  组件化：Header/Footer/ThemeToggle/Sidebar/PostList。PR #3 用户审阅合并。

- **2026-07-13 v1.1 公众号迁移完成（76 篇）**：全量正文 HTML 本地缓存 → `wechat2md.py` 批量转换
  （含图片压缩 JPEG q82/限宽 1400 与全站懒加载），slug 映射见 `docs/migration/slugs.json`，
  进度见 `docs/migration/checklist.md`。两篇示例占位文章已删除。idx 31 经核实与 idx 30
  为同一篇的重复发表记录，不迁移。每篇配 quote（原文最美一句）+ excerpt（trailer），
  首页列表双行展示。PR #2 已由用户审阅合并。

> 约定：每完成一次迭代，在此追加一条（日期 + 做了什么 + 关键决策），并同步更新上方相关章节。

- **2026-07-12 迁移到 Astro 5**：替换原零依赖 Python 静态生成器。内容层用 content collections
  （glob loader 直读 `content/`，markdown 与 frontmatter 未动）；样式/交互脚本原样进 `public/assets/`；
  RSS 手写端点复刻旧格式；关闭 Shiki 与 smartypants 保持排版口径。已删除 `templates/`、`scripts/`、
  `dist/`（旧产物）、`assets/`（被 `public/assets/` 取代），git 历史可找回。
  与旧站产物 diff 验证：仅链接改为绝对路径、标题新增 id 锚点、SVG 序列化差异三类预期变化。
- **2026-07-13 v1.0 上线**：GitHub 公开仓库（Nivael/sunzhonglun.com，默认分支 main）+ Vercel
  自动部署 + 域名 sunzhonglun.blog（.com 被抢注，详见 PRD §4.2）+ 基础 SEO
  （@astrojs/sitemap、OG/canonical meta、favicon.svg、404 页、robots.txt）。
  遗留：Vercel 跳转方向需翻转为 www → 裸域（PRD §4.5）。
- **2026-07-13 撰写 PRD**（`docs/PRD.md`）：确立产品定位（portfolio + 写作存档）、版本路线图
  （v1.0 上线 → v1.1 迁移 92 篇公众号文章 → v1.2 设计升级 portfolio 化 → v1.3 视频页）、
  协作与版本规则、非目标清单。公众号迁移采用直接抓取为主 + computer use 兜底的混合方案。

## 约定

- git 提交信息用中文
- 不要引入不必要的依赖，保持站点轻量、加载快
- 所有文案、注释用中文
- 每次迭代结束更新本文件的「迭代记录」与受影响章节
