// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** 正文图片懒加载：图多的文章不拖累首屏（自写 rehype 插件，避免引依赖） */
function rehypeLazyImages() {
  /** @param {any} node */
  const walk = (node) => {
    if (node.tagName === 'img') {
      node.properties = { ...node.properties, loading: 'lazy', decoding: 'async' };
    }
    (node.children || []).forEach(walk);
  };
  return (/** @type {any} */ tree) => walk(tree);
}

export default defineConfig({
  site: 'https://sunzhonglun.blog',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    // 保持与原 python-markdown 输出一致：
    // 不做代码高亮（样式全靠 style.css 的 pre/code 规则），
    // 不做智能引号替换（避免改动正文标点）。
    syntaxHighlight: false,
    smartypants: false,
    rehypePlugins: [rehypeLazyImages],
  },
});
