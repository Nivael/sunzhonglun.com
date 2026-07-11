# sunzhonglun.com

极简个人博客（Medium 风格 + 深色模式、阅读进度条、滚动渐现等细节交互）。
纯静态、零 npm 依赖：markdown 写作 + 一个 Python 构建脚本。

## 目录结构

```
content/posts/   文章（markdown，文件名 YYYY-MM-DD-slug.md）
content/about.md 关于页
assets/          样式、脚本、图片
templates/       页面模板
scripts/build.py 构建脚本
dist/            构建产物（整站静态文件）
site.json        站点标题、简介、域名
```

## 写一篇新文章

1. 在 `content/posts/` 新建 `2026-07-12-my-post.md`：

   ```
   ---
   title: 文章标题
   date: 2026-07-12
   ---

   正文……
   ```

2. 构建（需要 `pip3 install markdown`，仅首次）：

   ```
   python3 scripts/build.py
   ```

3. 打开 `dist/index.html` 预览。

图片放进 `assets/images/`，正文里写 `![说明](/assets/images/xxx.jpg)`。

## 部署

`dist/` 就是整个网站，推到任意静态托管即可（Netlify / Vercel / GitHub Pages / Cloudflare Pages），发布目录选 `dist`。
