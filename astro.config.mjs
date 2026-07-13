// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sunzhonglun.blog',
  output: 'static',
  markdown: {
    // 保持与原 python-markdown 输出一致：
    // 不做代码高亮（样式全靠 style.css 的 pre/code 规则），
    // 不做智能引号替换（避免改动正文标点）。
    syntaxHighlight: false,
    smartypants: false,
  },
});
