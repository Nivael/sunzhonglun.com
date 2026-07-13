#!/usr/bin/env python3
"""微信文章 HTML → markdown 转换器（迁移阶段 1-2 核心工具）。

用法:
  python3 docs/migration/wechat2md.py <index> <slug> [--dry-run]

<index> 为 articles.json 下标（正文读 html-cache/<index>.html，需先跑 fetch-html.py），
<slug> 为英文语义 slug。产出：
  content/posts/<date>-<slug>.md
  public/assets/images/<slug>/NN.<ext>（带微信 Referer 下载，绕防盗链）
--dry-run 只打印 markdown（图片保留原始 URL），不写任何文件。
"""
import json
import re
import subprocess
import sys
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
VOID = {"br", "img", "hr", "meta", "link", "input", "source"}
BLOCK = {"p", "section", "div", "blockquote", "figure",
         "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "hr", "pre", "table"}


# ============================================================================
# HTML 解析：容错地建一棵极简 DOM 树
# ============================================================================

class TreeBuilder(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = {"tag": "root", "attrs": {}, "kids": []}
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list) -> None:
        node = {"tag": tag, "attrs": dict(attrs), "kids": []}
        self.stack[-1]["kids"].append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list) -> None:
        self.stack[-1]["kids"].append({"tag": tag, "attrs": dict(attrs), "kids": []})

    def handle_endtag(self, tag: str) -> None:
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i]["tag"] == tag:
                del self.stack[i:]
                return

    def handle_data(self, data: str) -> None:
        if data:
            self.stack[-1]["kids"].append({"tag": "#text", "attrs": {}, "kids": [], "text": data})


def find_by_id(node: dict, id_: str):
    if node["attrs"].get("id") == id_:
        return node
    for kid in node["kids"]:
        if kid["tag"] != "#text" and (found := find_by_id(kid, id_)):
            return found
    return None


# ============================================================================
# markdown 转换
# ============================================================================

def clean(s: str) -> str:
    s = s.replace("\xa0", " ").replace("​", "").replace("‌", "").replace("﻿", "")
    return re.sub(r"\s+", " ", s)


def style_of(node: dict) -> str:
    return node["attrs"].get("style", "")


def is_bold(node: dict) -> bool:
    return node["tag"] in ("strong", "b") or bool(re.search(r"font-weight\s*:\s*(bold|[6-9]00)", style_of(node)))


def is_italic(node: dict) -> bool:
    return node["tag"] in ("em", "i") or "font-style: italic" in style_of(node)


class Converter:
    """收集图片 URL，转换用占位符，落盘时统一下载替换。"""

    def __init__(self) -> None:
        self.images: list[str] = []

    def img_md(self, node: dict) -> str:
        src = node["attrs"].get("data-src") or node["attrs"].get("src") or ""
        if not src or src.startswith("data:"):
            return ""
        self.images.append(src)
        return f"![]({chr(0)}{len(self.images) - 1}{chr(0)})"

    def inline(self, node: dict) -> str:
        if node["tag"] == "#text":
            return clean(node["text"])
        if node["tag"] in ("script", "style"):
            return ""
        if node["tag"] == "br":
            return "\n"
        if node["tag"] == "img":
            return self.img_md(node)
        s = "".join(self.inline(k) for k in node["kids"])
        if node["tag"] == "a" and node["attrs"].get("href") and s.strip():
            return f"[{s}]({node['attrs']['href']})"
        if node["tag"] == "code" and s.strip():
            return f"`{s}`"
        if is_bold(node) and s.strip():
            return f"**{s.strip()}**"
        if is_italic(node) and s.strip():
            return f"*{s.strip()}*"
        return s

    def has_block_child(self, node: dict) -> bool:
        return any(k["tag"] in BLOCK for k in node["kids"])

    def blocks(self, node: dict, out: list) -> None:
        for kid in node["kids"]:
            t = kid["tag"]
            if t in ("script", "style"):
                continue
            if t == "#text":
                if (s := clean(kid["text"])).strip():
                    out.append(("p", s))
            elif t == "hr":
                out.append(("hr", ""))
            elif t in ("h1", "h2"):
                out.append(("h2", self.inline(kid)))
            elif t in ("h3", "h4", "h5", "h6"):
                out.append(("h3", self.inline(kid)))
            elif t == "blockquote":
                sub: list = []
                self.blocks(kid, sub) if self.has_block_child(kid) else sub.append(("p", self.inline(kid)))
                out.append(("bq", sub))
            elif t in ("ul", "ol"):
                items = [self.inline(li).strip() for li in kid["kids"] if li["tag"] == "li"]
                out.append((t, [i for i in items if i]))
            elif t == "pre":
                out.append(("pre", self.text_only(kid)))
            elif t == "img":
                if (s := self.img_md(kid)):
                    out.append(("p", s))
            elif t in ("p", "section", "div", "figure", "table", "li"):
                if self.has_block_child(kid):
                    self.blocks(kid, out)
                elif (s := self.inline(kid)).strip():
                    out.append(("p", s))
            else:  # 块级位置上的 span 等，当段落处理
                if (s := self.inline(kid)).strip():
                    out.append(("p", s))

    def text_only(self, node: dict) -> str:
        if node["tag"] == "#text":
            return node["text"]
        return "".join(self.text_only(k) for k in node["kids"])

    def render(self, blocks: list) -> str:
        parts = []
        for kind, val in blocks:
            if kind == "p":
                parts.append(val.strip())
            elif kind == "h2":
                parts.append(f"## {val.strip()}")
            elif kind == "h3":
                parts.append(f"### {val.strip()}")
            elif kind == "hr":
                parts.append("---")
            elif kind == "bq":
                inner = self.render(val)
                parts.append("\n".join(f"> {line}" if line else ">" for line in inner.split("\n")))
            elif kind == "ul":
                parts.append("\n".join(f"- {i}" for i in val))
            elif kind == "ol":
                parts.append("\n".join(f"{n + 1}. {i}" for n, i in enumerate(val)))
            elif kind == "pre":
                parts.append(f"```\n{val.strip()}\n```")
        return "\n\n".join(p for p in parts if p)


# ============================================================================
# 图片下载与产出
# ============================================================================

def img_ext(url: str) -> str:
    m = re.search(r"wx_fmt=(\w+)", url)
    fmt = (m.group(1) if m else "jpg").lower()
    return {"jpeg": "jpg", "other": "jpg"}.get(fmt, fmt)


def optimize(dest: Path) -> Path:
    """微信原图动辄 1-2MB PNG，直接上站会拖垮加载。
    >300KB 的静态图：限宽 1400px（44rem 版心的 2x retina 足够）并转 JPEG 质量 82。
    GIF 跳过（sips 会丢动画）。透明 PNG 会失去透明度——文章配图均为照片，可接受。"""
    if dest.suffix == ".gif" or dest.stat().st_size < 300_000:
        return dest
    out = dest.with_suffix(".jpg")
    subprocess.run(
        ["sips", "-Z", "1400", "-s", "format", "jpeg", "-s", "formatOptions", "82",
         str(dest), "--out", str(out)],
        check=True, capture_output=True,
    )
    if out != dest:
        dest.unlink()
    return out


def download_images(urls: list, slug: str) -> list:
    img_dir = ROOT / "public" / "assets" / "images" / slug
    paths = []
    for n, url in enumerate(urls):
        existing = sorted(img_dir.glob(f"{n + 1:02d}.*")) if img_dir.exists() else []
        if existing:
            dest = existing[0]
        else:
            img_dir.mkdir(parents=True, exist_ok=True)
            dest = img_dir / f"{n + 1:02d}.{img_ext(url)}"
            req = urllib.request.Request(url, headers={
                "User-Agent": UA,
                "Referer": "https://mp.weixin.qq.com/",  # 微信图片防盗链
            })
            raw = urllib.request.urlopen(req, timeout=30).read()
            dest.write_bytes(raw)
            dest = optimize(dest)
            print(f"  图片 {dest.name} ({dest.stat().st_size // 1024} KB，原始 {len(raw) // 1024} KB)")
            time.sleep(0.5)
        paths.append(f"/assets/images/{slug}/{dest.name}")
    return paths


def convert(index: int, slug: str, dry_run: bool) -> None:
    arts = json.loads((HERE / "articles.json").read_text(encoding="utf-8"))
    art = arts[index]
    html = (HERE / "html-cache" / f"{index:02d}.html").read_text(encoding="utf-8")

    tb = TreeBuilder()
    tb.feed(html)
    content = find_by_id(tb.root, "js_content")
    if not content:
        sys.exit(f"[{index:02d}] 找不到 js_content 正文容器")

    conv = Converter()
    out: list = []
    conv.blocks(content, out)
    md = conv.render(out)

    if dry_run:
        for n, url in enumerate(conv.images):
            md = md.replace(f"{chr(0)}{n}{chr(0)}", url)
        print(f"--- {art['date']} {art['title']}（图片 {len(conv.images)} 张）---\n")
        print(md)
        return

    paths = download_images(conv.images, slug)
    for n, p in enumerate(paths):
        md = md.replace(f"{chr(0)}{n}{chr(0)}", p)

    front = f'---\ntitle: "{art["title"].replace(chr(34), chr(39))}"\ndate: {art["date"]}\n---\n\n'
    dest = ROOT / "content" / "posts" / f"{art['date']}-{slug}.md"
    dest.write_text(front + md + "\n", encoding="utf-8")
    print(f"[{index:02d}] {art['title']} -> {dest.relative_to(ROOT)}（图片 {len(conv.images)} 张）")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--dry-run"]
    if len(args) != 2:
        sys.exit(__doc__)
    convert(int(args[0]), args[1], "--dry-run" in sys.argv)
