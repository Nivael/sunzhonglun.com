# sunzhonglun.com — 个人博客

## 项目背景

Zhonglun 的个人博客，用于收录过往微信公众号文章 + 之后的新写作，后续还会加视频页。
本仓库当前是一个**零依赖静态站**（markdown + `scripts/build.py`），是在无法使用 npm 的环境里搭的过渡方案。
**下一步计划：迁移到 Astro**，完整保留现有设计和内容格式。

## 当前结构

```
content/posts/    文章，markdown，文件名 YYYY-MM-DD-slug.md
content/about.md  关于页
assets/           style.css / main.js / images/
templates/        base.html 页面模板
scripts/build.py  构建脚本（python3 + markdown 库）
dist/             构建产物（整站静态文件，已提交）
site.json         站点标题、简介、域名（sunzhonglun.com）
```

文章 frontmatter 约定：`title`、`date`（YYYY-MM-DD）、可选 `excerpt`、`slug`。
正文图片写 `/assets/images/...`（构建时会改写为相对路径）。
当前两篇文章是**示例占位**，公众号文章迁入后删除。

## 设计规范（迁移 Astro 时必须保留）

风格：Medium 式极简 + 精致微交互。所有样式见 `assets/style.css`，交互见 `assets/main.js`。

- 版心 44rem；正文衬线字体（Source Serif 4 / Georgia / Songti SC / Noto Serif SC），字号 1.15rem，行高 2.05，letter-spacing .012em；UI 与标题用系统无衬线（PingFang SC 等）
- 配色：浅色 bg #fff、正文 rgba(0,0,0,.84)、强调色 #147d64；深色 bg #121212、强调色 #4cc2a4。全部走 CSS 变量，`[data-theme="dark"]` 切换
- 交互细节（都要保留）：
  - 深色模式：跟随系统 + 手动切换，localStorage 记忆，head 内联脚本防闪白
  - 文章页顶部 2px 阅读进度条（scaleX）
  - 滚动渐现（IntersectionObserver + .reveal，尊重 prefers-reduced-motion）
  - 首页文章标题 hover 下划线从左向右生长动效
  - 页面加载淡入、主题切换按钮 hover 旋转
- 中文排版优先：引用块左侧竖线、分隔线短居中、图片圆角居中

## 迁移到 Astro 的要求

- 内容层用 content collections，直接复用现有 markdown 与 frontmatter 字段
- 保留 RSS（现有 `dist/feed.xml` 由构建脚本生成）
- 输出静态站（`output: 'static'`），部署目标 Vercel 或 Cloudflare Pages，域名 sunzhonglun.com
- 迁移完成后可删除 `templates/`、`scripts/`、`dist/`，但**先确认新站构建效果一致**

## 待办

1. 迁移到 Astro（见上）
2. 公众号文章迁移：只有文章 URL（mp.weixin.qq.com），需抓取正文 + 下载图片到本地（微信图片有 referer 防盗链，下载时带 `Referer: https://mp.weixin.qq.com/`），转为 markdown 入 `content/posts/`
3. 视频页：暂缓，之后规划（大概率嵌入 B 站/YouTube）

## 约定

- git 提交信息用中文
- 不要引入不必要的依赖，保持站点轻量、加载快
- 所有文案、注释用中文
