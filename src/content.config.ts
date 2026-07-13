// 内容集合定义：直接复用仓库根部 content/ 下的现有 markdown 与 frontmatter 字段
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string().optional(),
    quote: z.string().optional(), // 原文最美一句，首页预览位展示
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: 'about.md', base: './content' }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { posts, pages };
