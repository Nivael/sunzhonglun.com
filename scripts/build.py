#!/usr/bin/env python3
"""零依赖静态博客生成器（仅需 python3 + markdown 库）。

用法: python3 scripts/build.py
输出: dist/ 目录，可直接用浏览器打开或部署到任意静态托管。
"""
import json
import re
import shutil
from datetime import datetime
from html import escape
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
POSTS_DIR = CONTENT / "posts"
TEMPLATES = ROOT / "templates"
ASSETS = ROOT / "assets"
DIST = ROOT / "dist"


def parse_frontmatter(text: str):
    meta, body = {}, text
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?", text, re.S)
    if m:
        body = text[m.end():]
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip().strip('"').strip("'")
    return meta, body


def md_to_html(body: str) -> str:
    return markdown.markdown(body, extensions=["extra"], output_format="html5")


def reading_minutes(body: str) -> int:
    cjk = len(re.findall(r"[一-鿿]", body))
    words = len(re.findall(r"[A-Za-z0-9]+", body))
    return max(1, round((cjk + words * 2) / 400))


def first_paragraph(body: str) -> str:
    for block in body.split("\n\n"):
        t = block.strip()
        if not t or t.startswith(("#", "!", ">", "```", "---")):
            continue
        t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)      # 链接 -> 文本
        t = re.sub(r"[*_`#>]", "", t).replace("\n", " ")
        return t[:120]
    return ""


def render(template: str, root: str, site: dict, **kw) -> str:
    out = template
    # 注意顺序：先替换 body 等内容，最后替换 {{root}}，
    # 这样 body 里的 {{root}} 也能被处理。
    tokens = {
        **kw,
        "site_title": site["title"],
        "year": str(datetime.now().year),
        "root": root,
    }
    for k, v in tokens.items():
        out = out.replace("{{%s}}" % k, v)
    # 正文中以 / 开头的站内路径改写为相对路径，便于 file:// 预览
    out = out.replace('src="/', 'src="' + root).replace('href="//', "\x00")
    out = out.replace('href="/', 'href="' + root).replace("\x00", 'href="//')
    return out


def load_posts():
    posts = []
    for f in sorted(POSTS_DIR.glob("*.md")):
        meta, body = parse_frontmatter(f.read_text(encoding="utf-8"))
        slug = meta.get("slug") or re.sub(r"^\d{4}-\d{2}-\d{2}-", "", f.stem)
        date = meta.get("date", "1970-01-01")
        posts.append({
            "slug": slug,
            "title": meta.get("title", slug),
            "date": date,
            "date_display": date.replace("-", " · ", 1).replace("-", " · "),
            "excerpt": meta.get("excerpt") or first_paragraph(body),
            "minutes": reading_minutes(body),
            "html": md_to_html(body),
        })
    posts.sort(key=lambda p: p["date"], reverse=True)
    return posts


def build():
    site = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
    base = (TEMPLATES / "base.html").read_text(encoding="utf-8")

    DIST.mkdir(exist_ok=True)
    shutil.copytree(ASSETS, DIST / "assets", dirs_exist_ok=True)

    posts = load_posts()

    # ---- 首页 ----
    items = []
    for p in posts:
        items.append(
            '<li class="post-item reveal"><a href="posts/{slug}/index.html">'
            '<div class="post-meta">{date} · 约 {minutes} 分钟</div>'
            "<h2>{title}</h2>"
            '<p class="post-excerpt">{excerpt}</p>'
            "</a></li>".format(
                slug=p["slug"], date=escape(p["date"]), minutes=p["minutes"],
                title=escape(p["title"]), excerpt=escape(p["excerpt"]),
            )
        )
    home_body = (
        '<section class="hero reveal"><h1>{t}</h1><p>{d}</p></section>\n'
        '<main class="home-main"><ul class="post-list">\n{items}\n</ul></main>'
    ).format(t=escape(site["title"]), d=escape(site["description"]), items="\n".join(items))
    (DIST / "index.html").write_text(
        render(base, "", site, title=site["title"], description=site["description"], body=home_body),
        encoding="utf-8",
    )

    # ---- 文章页 ----
    for p in posts:
        out_dir = DIST / "posts" / p["slug"]
        out_dir.mkdir(parents=True, exist_ok=True)
        post_body = (
            '<article class="post"><header class="post-header reveal">'
            "<h1>{title}</h1>"
            '<div class="post-meta">{date} · 约 {minutes} 分钟</div></header>'
            '<div class="post-content">{content}</div>'
            '<footer class="post-footer"><a class="back" href="{{{{root}}}}index.html">← 返回首页</a></footer>'
            "</article>"
        ).format(title=escape(p["title"]), date=escape(p["date"]), minutes=p["minutes"], content=p["html"])
        (out_dir / "index.html").write_text(
            render(base, "../../", site, title="%s — %s" % (p["title"], site["title"]),
                   description=p["excerpt"], body=post_body),
            encoding="utf-8",
        )

    # ---- 关于页 ----
    about_md = CONTENT / "about.md"
    if about_md.exists():
        meta, body = parse_frontmatter(about_md.read_text(encoding="utf-8"))
        about_body = (
            '<article class="post"><header class="post-header reveal"><h1>{title}</h1></header>'
            '<div class="post-content">{content}</div></article>'
        ).format(title=escape(meta.get("title", "关于")), content=md_to_html(body))
        (DIST / "about").mkdir(exist_ok=True)
        (DIST / "about" / "index.html").write_text(
            render(base, "../", site, title="关于 — %s" % site["title"],
                   description=site["description"], body=about_body),
            encoding="utf-8",
        )

    # ---- RSS ----
    rss_items = []
    for p in posts[:20]:
        rss_items.append(
            "<item><title>{title}</title><link>{url}/posts/{slug}/</link>"
            "<guid>{url}/posts/{slug}/</guid><pubDate>{pub}</pubDate>"
            "<description>{desc}</description></item>".format(
                title=escape(p["title"]), url=site["url"], slug=p["slug"],
                pub=datetime.strptime(p["date"], "%Y-%m-%d").strftime("%a, %d %b %Y 00:00:00 +0800"),
                desc=escape(p["excerpt"]),
            )
        )
    (DIST / "feed.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>'
        "<title>{t}</title><link>{u}</link><description>{d}</description>{items}"
        "</channel></rss>".format(t=escape(site["title"]), u=site["url"],
                                  d=escape(site["description"]), items="".join(rss_items)),
        encoding="utf-8",
    )

    print("构建完成: %d 篇文章 -> %s" % (len(posts), DIST))


if __name__ == "__main__":
    build()
