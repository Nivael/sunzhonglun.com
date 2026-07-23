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
    cover: z.string().regex(/^\/assets\/images\//).optional(), // 无正文插图的旧稿复用公众号题图
  }),
});

// 英文译稿与中文源稿使用完全相同的文件名/id；date 与 slug 始终从中文源稿取得，
// 避免双份元数据随时间漂移。只有放进此目录的完成稿才会出现在英文站。
const postsEn = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/posts-en' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    quote: z.string(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: 'about.md', base: './content' }),
  schema: z.object({
    title: z.string(),
  }),
});

const pagesEn = defineCollection({
  loader: glob({ pattern: 'about-en.md', base: './content' }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { posts, postsEn, pages, pagesEn };
