// RSS：格式与原 scripts/build.py 生成的 feed.xml 保持一致
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import site from '../../site.json';
import { sortPostsDesc, postSlug, excerptOf, pubDate } from '../lib/posts';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export const GET: APIRoute = async () => {
  const posts = sortPostsDesc(await getCollection('posts')).slice(0, 20);
  const items = posts
    .map((p) => {
      const url = `${site.url}/posts/${postSlug(p)}/`;
      return (
        `<item><title>${esc(p.data.title)}</title><link>${url}</link>` +
        `<guid>${url}</guid><pubDate>${pubDate(p.data.date)}</pubDate>` +
        `<description>${esc(excerptOf(p))}</description></item>`
      );
    })
    .join('');
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>' +
    `<title>${esc(site.title)}</title><link>${site.url}</link>` +
    `<description>${esc(site.description)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
