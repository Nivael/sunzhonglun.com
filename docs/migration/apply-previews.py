#!/usr/bin/env python3
"""把 quote（原文最美一句）与 excerpt（一句话 trailer）注入文章 frontmatter。

用法: python3 docs/migration/apply-previews.py <previews.json>
JSON 格式: { "<md 文件名>": {"quote": "...", "excerpt": "..."}, ... }
已有同名字段会被替换（便于返工）。
"""
import json
import re
import sys
from pathlib import Path

POSTS = Path(__file__).resolve().parent.parent.parent / "content" / "posts"


def set_field(front: str, key: str, value: str) -> str:
    value = value.replace('"', "'").strip()
    line = f'{key}: "{value}"'
    if re.search(rf"^{key}:", front, re.M):
        return re.sub(rf"^{key}:.*$", line, front, count=1, flags=re.M)
    return front.rstrip("\n") + "\n" + line + "\n"


def main() -> None:
    data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    for name, fields in data.items():
        p = POSTS / name
        text = p.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
        if not m:
            sys.exit(f"{name}: 无 frontmatter")
        front = m.group(1)
        for key in ("quote", "excerpt"):
            if fields.get(key):
                front = set_field(front, key, fields[key])
        p.write_text(f"---\n{front.rstrip(chr(10))}\n---\n" + text[m.end():], encoding="utf-8")
        print(f"✓ {name}")


if __name__ == "__main__":
    main()
