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
content/about.md      关于页
public/assets/        style.css / main.js / images/（原样拷贝，不经打包）
src/content.config.ts 内容集合定义（glob loader 指向 content/，复用现有 frontmatter）
src/layouts/Base.astro 页面骨架（顶栏、页脚、主题脚本、进度条）
src/pages/            index / posts/[slug] / about / feed.xml.ts
src/lib/posts.ts      阅读时长、摘要提取、slug、日期格式（与旧构建脚本口径一致）
site.json             站点标题、简介、域名
astro.config.mjs      关闭 Shiki 高亮与 smartypants（保持排版口径，勿开）
```

文章 frontmatter 约定：`title`、`date`（YYYY-MM-DD）、可选 `excerpt`、`slug`。
URL slug = frontmatter `slug`，否则文件名去掉日期前缀。
正文图片放 `public/assets/images/`，正文里写 `/assets/images/...`。
当前两篇文章是**示例占位**，公众号文章迁入后删除。

## 常用命令

```
npm run dev       开发预览（localhost:4321）
npm run build     构建到 dist/（已 gitignore）
npm run preview   预览构建产物
```

## 设计规范（改动时必须保留）

风格：Medium 式极简 + 精致微交互。所有样式见 `public/assets/style.css`，交互见 `public/assets/main.js`。

- 版心 44rem；正文衬线字体（Source Serif 4 / Georgia / Songti SC / Noto Serif SC），字号 1.15rem，行高 2.05，letter-spacing .012em；UI 与标题用系统无衬线（PingFang SC 等）
- 配色：浅色 bg #fff、正文 rgba(0,0,0,.84)、强调色 #147d64；深色 bg #121212、强调色 #4cc2a4。全部走 CSS 变量，`[data-theme="dark"]` 切换
- 交互细节（都要保留）：
  - 深色模式：跟随系统 + 手动切换，localStorage 记忆，head 内联脚本防闪白（Base.astro 中必须 `is:inline`）
  - 文章页顶部 2px 阅读进度条（scaleX）
  - 滚动渐现（IntersectionObserver + .reveal，尊重 prefers-reduced-motion）
  - 首页文章标题 hover 下划线从左向右生长动效
  - 页面加载淡入、主题切换按钮 hover 旋转
- 中文排版优先：引用块左侧竖线、分隔线短居中、图片圆角居中

## 关键实现细节

- **markdown 渲染口径**：`astro.config.mjs` 里 `syntaxHighlight: false`、`smartypants: false`。
  前者保证代码块只走 style.css 的 pre/code 样式，后者避免正文标点被替换。
  开启任意一个都会改变现有排版效果。
- **日期时区**：frontmatter 日期按 UTC 解析，`src/lib/posts.ts` 里全部用 `getUTC*` 取值，
  避免东八区下日期偏移一天。
- **RSS**（`src/pages/feed.xml.ts`）：手写 XML，格式与旧站 feed.xml 逐字节等价
  （pubDate 固定 `+0800`），不引入 @astrojs/rss 依赖。

## 待办

见 [docs/PRD.md](docs/PRD.md) §3 版本路线图。下一步：**v1.0 上线**（GitHub 仓库 + 域名 + Vercel + 基础 SEO），
其中域名购买、GitHub 账号等需用户操作的项列在 PRD §11 开放问题。

## 迭代记录

> 约定：每完成一次迭代，在此追加一条（日期 + 做了什么 + 关键决策），并同步更新上方相关章节。

- **2026-07-12 迁移到 Astro 5**：替换原零依赖 Python 静态生成器。内容层用 content collections
  （glob loader 直读 `content/`，markdown 与 frontmatter 未动）；样式/交互脚本原样进 `public/assets/`；
  RSS 手写端点复刻旧格式；关闭 Shiki 与 smartypants 保持排版口径。已删除 `templates/`、`scripts/`、
  `dist/`（旧产物）、`assets/`（被 `public/assets/` 取代），git 历史可找回。
  与旧站产物 diff 验证：仅链接改为绝对路径、标题新增 id 锚点、SVG 序列化差异三类预期变化。
- **2026-07-13 撰写 PRD**（`docs/PRD.md`）：确立产品定位（portfolio + 写作存档）、版本路线图
  （v1.0 上线 → v1.1 迁移 92 篇公众号文章 → v1.2 设计升级 portfolio 化 → v1.3 视频页）、
  协作与版本规则、非目标清单。公众号迁移采用直接抓取为主 + computer use 兜底的混合方案。

## 约定

- git 提交信息用中文
- 不要引入不必要的依赖，保持站点轻量、加载快
- 所有文案、注释用中文
- 每次迭代结束更新本文件的「迭代记录」与受影响章节
