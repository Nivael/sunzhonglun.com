#!/usr/bin/env python3
"""从公众号 HTML 缓存恢复未进入正文的题图，并写入文章 cover 元数据。

仅处理没有正文站内图片、没有 cover 字段，且能与 articles.json 对应的迁移旧稿。
重复执行是安全的：已有图片与 cover 字段都会跳过。
"""

from __future__ import annotations

import html
import json
import re
import subprocess
import time
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def frontmatter_value(source: str, key: str) -> str | None:
    match = re.search(rf'^{re.escape(key)}:\s*["\']?(.*?)["\']?\s*$', source, re.MULTILINE)
    return match.group(1) if match else None


def cover_url(cache: str) -> str | None:
    match = re.search(r'<meta property="og:image" content="([^"]+)"', cache)
    if not match:
        return None
    return html.unescape(match.group(1)).replace("http://", "https://", 1)


def optimize(dest: Path) -> Path:
    if dest.stat().st_size < 300_000:
        return dest
    subprocess.run(
        [
            "sips",
            "-Z",
            "1400",
            "-s",
            "format",
            "jpeg",
            "-s",
            "formatOptions",
            "82",
            str(dest),
            "--out",
            str(dest),
        ],
        check=True,
        capture_output=True,
    )
    return dest


def download(url: str, dest: Path) -> None:
    if dest.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Referer": "https://mp.weixin.qq.com/"},
    )
    raw = urllib.request.urlopen(request, timeout=30).read()
    dest.write_bytes(raw)
    optimize(dest)
    time.sleep(0.5)


def add_cover(source: str, path: str) -> str:
    marker = "\n---\n"
    start = source.find(marker, 3)
    if start < 0:
        raise ValueError("frontmatter 未闭合")
    return source[:start] + f'\ncover: "{path}"' + source[start:]


def main() -> None:
    articles = json.loads((HERE / "articles.json").read_text(encoding="utf-8"))
    restored = 0

    for post in sorted((ROOT / "content" / "posts").glob("*.md")):
        source = post.read_text(encoding="utf-8")
        if re.search(r"^cover:", source, re.MULTILINE):
            continue
        if re.search(r"!\[[^\]]*\]\(/assets/", source):
            continue

        title = frontmatter_value(source, "title")
        date = frontmatter_value(source, "date")
        index = next(
            (
                i
                for i, article in enumerate(articles)
                if article["title"] == title and article["date"] == date
            ),
            None,
        )
        if index is None:
            continue

        cache = (HERE / "html-cache" / f"{index:02d}.html").read_text(encoding="utf-8")
        url = cover_url(cache)
        if not url:
            raise RuntimeError(f"{post.name} 的 HTML 缓存缺少 og:image")

        slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", post.stem)
        relative = f"/assets/images/{slug}/cover.jpg"
        download(url, ROOT / "public" / relative.removeprefix("/"))
        post.write_text(add_cover(source, relative), encoding="utf-8")
        restored += 1
        print(f"{post.name} -> {relative}")

    print(f"已恢复 {restored} 篇题图")


if __name__ == "__main__":
    main()
