// 与原 scripts/build.py 保持一致的文章元信息计算
import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

// glob loader 的 id：frontmatter 有 slug 时用 slug，否则是文件名（去扩展名）。
// 这里再去掉日期前缀，得到与旧站相同的 URL slug。
export function postSlug(post: Post): string {
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
