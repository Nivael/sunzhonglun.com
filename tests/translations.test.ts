import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const sourceDir = join(root, 'content/posts');
const translationDir = join(root, 'content/posts-en');
const sourcePosts = readdirSync(sourceDir).filter((name) => name.endsWith('.md')).sort();
const translations = readdirSync(translationDir).filter((name) => name.endsWith('.md'));
const backlog = JSON.parse(
  readFileSync(join(root, 'tests/translation-backlog.json'), 'utf8'),
) as string[];

function frontmatterValue(markdown: string, key: string): string | undefined {
  const match = markdown.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
  return match?.[1];
}

function imagePaths(markdown: string): string[] {
  return [...markdown.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)].map((match) => match[1]);
}

describe('英文译稿完整性', () => {
  it('未译文章必须是已登记的历史欠稿', () => {
    const translated = new Set(translations);
    const missing = sourcePosts.filter((filename) => !translated.has(filename));
    expect(missing).toEqual(backlog);
  });

  it('backlog 不含重复、乱序或不存在的源稿', () => {
    expect(backlog).toEqual([...new Set(backlog)].sort());
    for (const filename of backlog) {
      expect(sourcePosts, filename).toContain(filename);
    }
  });

  it('每篇译稿都有同名中文源稿', () => {
    for (const filename of translations) {
      expect(existsSync(join(sourceDir, filename)), basename(filename)).toBe(true);
    }
  });

  it('英文元数据只维护标题、引文与摘要', () => {
    for (const filename of translations) {
      const markdown = readFileSync(join(translationDir, filename), 'utf8');
      const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const keys = [...frontmatter.matchAll(/^([a-zA-Z][\w-]*):/gm)]
        .map((match) => match[1])
        .sort();
      expect(keys, basename(filename)).toEqual(['excerpt', 'quote', 'title']);
    }
  });

  it('英文 quote 逐字出现在正文', () => {
    for (const filename of translations) {
      const markdown = readFileSync(join(translationDir, filename), 'utf8');
      const quote = frontmatterValue(markdown, 'quote');
      const body = markdown.replace(/^---[\s\S]*?---\s*/, '');
      expect(quote, basename(filename)).toBeTruthy();
      expect(body, basename(filename)).toContain(quote);
    }
  });

  it('英文稿完整保留中文源稿的图片及顺序', () => {
    for (const filename of translations) {
      const source = readFileSync(join(sourceDir, filename), 'utf8');
      const translation = readFileSync(join(translationDir, filename), 'utf8');
      expect(imagePaths(translation), basename(filename)).toEqual(imagePaths(source));
    }
  });
});
