# sunzhonglun.com

极简个人博客（Medium 风格 + 深色模式、阅读进度条、滚动渐现等细节交互）。
基于 [Astro](https://astro.build) 静态生成，markdown 写作。

## 目录结构

```
content/posts/   文章（markdown，文件名 YYYY-MM-DD-slug.md）
content/about.md 关于页
public/assets/   样式、脚本、图片
src/             Astro 布局、页面、内容集合定义
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

2. 本地预览：

   ```
   npm install   # 仅首次
   npm run dev   # http://localhost:4321
   ```

图片放进 `public/assets/images/`，正文里写 `![说明](/assets/images/xxx.jpg)`。

## 部署

```
npm run build
```

`dist/` 就是整个网站，推到任意静态托管即可（Vercel / Cloudflare Pages / Netlify / GitHub Pages），构建命令 `npm run build`，发布目录 `dist`。
