#!/usr/bin/env python3
"""迁移阶段 2：按 slugs.json 批量转换。

用法: python3 docs/migration/convert-batch.py <start> <end>   # 闭区间 index
已转换过（同名 md 已存在）或无缓存的自动跳过，可安全重跑。
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wechat2md import HERE, ROOT, convert  # noqa: E402


def main() -> None:
    start, end = int(sys.argv[1]), int(sys.argv[2])
    slugs = json.loads((HERE / "slugs.json").read_text(encoding="utf-8"))
    arts = json.loads((HERE / "articles.json").read_text(encoding="utf-8"))
    done, skipped = 0, []
    for i in range(start, end + 1):
        slug = slugs.get(str(i))
        if not slug:
            skipped.append((i, "无 slug"))
            continue
        if not (HERE / "html-cache" / f"{i:02d}.html").exists():
            skipped.append((i, "无缓存"))
            continue
        dest = ROOT / "content" / "posts" / f"{arts[i]['date']}-{slug}.md"
        if dest.exists():
            continue
        convert(i, slug, False)
        done += 1
    print(f"batch {start}-{end}: 新转换 {done} 篇")
    for i, why in skipped:
        print(f"  跳过 [{i:02d}] {arts[i]['title']}: {why}")


if __name__ == "__main__":
    main()
