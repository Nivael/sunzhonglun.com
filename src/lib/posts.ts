// 与原 scripts/build.py 保持一致的文章元信息计算
import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type EnglishPost = CollectionEntry<'postsEn'>;
export interface EnglishPostPair {
  source: Post;
  translation: EnglishPost;
}

// glob loader 的 id：frontmatter 有 slug 时用 slug，否则是文件名（去扩展名）。
// 这里再去掉日期前缀，得到与旧站相同的 URL slug。
export function postSlug(post: { id: string }): string {
  return post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

// 阅读时长：中日韩字符按 1 计，英文单词按 2 计，每分钟 400
export function readingMinutes(body: string): number {
  const cjk = (body.match(/[一-鿿]/g) || []).length;
  const words = (body.match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.round((cjk + words * 2) / 400));
}

// 无 excerpt 时取正文第一个普通段落的前 120 字
export function firstParagraph(body: string): string {
  for (const block of body.split('\n\n')) {
    const t = block.trim();
    if (!t || /^(#|!|>|```|---)/.test(t)) continue;
    return t
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_`#>]/g, '')
      .replace(/\n/g, ' ')
      .slice(0, 120);
  }
  return '';
}

export function excerptOf(post: Post): string {
  return post.data.excerpt || firstParagraph(post.body ?? '');
}

// 正文首张站内图片；没有则返回 null
export function firstImage(body: string): string | null {
  const m = body.match(/!\[[^\]]*\]\((\/assets\/[^)\s]+)/);
  return m ? m[1] : null;
}

// 列表封面：恢复的公众号题图优先，否则取正文首图；两者都没有时返回 null
export function coverImage(post: { data: { cover?: string }; body?: string }): string | null {
  return post.data.cover || firstImage(post.body ?? '');
}

// frontmatter 的日期按 UTC 解析，取值也用 UTC，避免时区偏移一天
function ymd(date: Date): [string, string, string] {
  return [
    String(date.getUTCFullYear()),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ];
}

// "2026-07-11" -> "2026 · 07 · 11"
export function dateDisplay(date: Date): string {
  return ymd(date).join(' · ');
}

// "2026-07-11" -> "2026-07-11"（RSS 之外的纯文本场景）
export function dateISO(date: Date): string {
  return ymd(date).join('-');
}

// RSS pubDate："Sat, 11 Jul 2026 00:00:00 +0800"（与旧构建脚本一致）
export function pubDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m, d] = ymd(date);
  return `${days[date.getUTCDay()]}, ${d} ${months[date.getUTCMonth()]} ${y} 00:00:00 +0800`;
}

export function sortPostsDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// 英文译稿按 id 与中文源稿配对；日期、slug、分类和封面都取自中文源稿。
// 孤立译稿直接中止构建，避免发布没有来源或链接错位的英文文章。
export function pairEnglishPosts(posts: Post[], translations: EnglishPost[]): EnglishPostPair[] {
  const sources = new Map(posts.map((post) => [post.id, post]));
  return translations.map((translation) => {
    const source = sources.get(translation.id);
    if (!source) throw new Error(`英文译稿缺少中文源稿：${translation.id}`);
    return { source, translation };
  });
}

export function sortEnglishPairsDesc(pairs: EnglishPostPair[]): EnglishPostPair[] {
  return [...pairs].sort((a, b) => b.source.data.date.getTime() - a.source.data.date.getTime());
}

// ============================================================================
// 分类：由标题推导（PRD §6.2.5），不加 frontmatter 字段——标题即分类
// Jazz / Portrait / Sketch 由标题关键词识别（含 June Portrait 等变体），其余归「文」
// ============================================================================

export const CATEGORIES = [
  { name: '文', slug: 'wen' },
  { name: 'Portrait', slug: 'portrait' },
  { name: 'Sketch', slug: 'sketch' },
  { name: 'Jazz', slug: 'jazz' },
] as const;

export type CategoryName = (typeof CATEGORIES)[number]['name'];

export function categoryFromTitle(title: string): CategoryName {
  if (/jazz/i.test(title)) return 'Jazz';
  if (/portrait/i.test(title)) return 'Portrait';
  if (/sketch/i.test(title)) return 'Sketch';
  return '文';
}

export function categoryOf(post: Post): CategoryName {
  return categoryFromTitle(post.data.title);
}

export function categoryNameEn(category: CategoryName): string {
  return category === '文' ? 'Essay' : category;
}

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}
