import { describe, expect, it } from 'vitest';
import {
  categoryBySlug,
  categoryFromTitle,
  dateDisplay,
  dateISO,
  firstImage,
  firstParagraph,
  pubDate,
  readingMinutes,
} from '../src/lib/posts';

describe('categoryFromTitle：标题即分类', () => {
  it('识别 Jazz 系列', () => {
    expect(categoryFromTitle('Jazz 1:  自慰颂歌')).toBe('Jazz');
    expect(categoryFromTitle('Jazz 5: 蛇臀 Earl Tucker')).toBe('Jazz');
  });
  it('识别 Portrait 系列，含 June Portrait 变体', () => {
    expect(categoryFromTitle('Portrait 11: 游戏机')).toBe('Portrait');
    expect(categoryFromTitle('June Portrait')).toBe('Portrait');
    expect(categoryFromTitle('June Portrait 2: The Blue Replica')).toBe('Portrait');
  });
  it('识别 Sketch 系列，含无编号变体', () => {
    expect(categoryFromTitle('Sketch 7: 爱情生活')).toBe('Sketch');
    expect(categoryFromTitle('Sketch: 教堂')).toBe('Sketch');
  });
  it('其余标题归「文」', () => {
    expect(categoryFromTitle('银河之一日')).toBe('文');
    expect(categoryFromTitle('陀思妥耶夫斯基——下水道里的俄罗斯人')).toBe('文');
    expect(categoryFromTitle('《追随者手记》第一幕')).toBe('文');
    expect(categoryFromTitle('')).toBe('文');
  });
});

describe('categoryBySlug', () => {
  it('四个分类 slug 均可反查', () => {
    expect(categoryBySlug('wen')?.name).toBe('文');
    expect(categoryBySlug('jazz')?.name).toBe('Jazz');
    expect(categoryBySlug('portrait')?.name).toBe('Portrait');
    expect(categoryBySlug('sketch')?.name).toBe('Sketch');
  });
  it('未知 slug 返回 undefined', () => {
    expect(categoryBySlug('video')).toBeUndefined();
  });
});

describe('readingMinutes：与旧构建脚本口径一致', () => {
  it('中日韩字符按 1 计、英文单词按 2 计、每分钟 400、至少 1 分钟', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('好'.repeat(400))).toBe(1);
    expect(readingMinutes('好'.repeat(700))).toBe(2);
    expect(readingMinutes('word '.repeat(400))).toBe(2);
  });
});

describe('firstParagraph：跳过标题/图片/引用/代码块', () => {
  it('取第一个普通段落，去除行内标记并截断到 120 字', () => {
    const body = '# 标题\n\n![](img.png)\n\n> 引用\n\n这是**正文**的[链接](https://a)。\n\n第二段。';
    expect(firstParagraph(body)).toBe('这是正文的链接。');
  });
  it('全部为特殊块时返回空串', () => {
    expect(firstParagraph('# 只有标题')).toBe('');
  });
});

describe('日期格式：UTC 取值，避免东八区偏移', () => {
  const d = new Date('2026-06-11T00:00:00Z');
  it('dateISO', () => expect(dateISO(d)).toBe('2026-06-11'));
  it('dateDisplay', () => expect(dateDisplay(d)).toBe('2026 · 06 · 11'));
  it('pubDate 与旧 feed.xml 格式一致', () =>
    expect(pubDate(d)).toBe('Thu, 11 Jun 2026 00:00:00 +0800'));
});

describe('firstImage：正文首图作杂志网格封面', () => {
  it('取第一张站内图片', () => {
    expect(firstImage('开头\n\n![](/assets/images/a/1.jpg)\n\n![](/assets/images/a/2.jpg)')).toBe('/assets/images/a/1.jpg');
  });
  it('带 alt 文本也能取到', () => {
    expect(firstImage('![某图](/assets/images/b/x.png) 后文')).toBe('/assets/images/b/x.png');
  });
  it('忽略站外图片', () => {
    expect(firstImage('![](https://example.com/x.jpg)')).toBeNull();
  });
  it('无图返回 null', () => {
    expect(firstImage('纯文字段落而已')).toBeNull();
  });
});
