#!/usr/bin/env python3
"""迁移工具：把 articles.json 里所有文章的原始 HTML 缓存到本地。

用法: python3 docs/migration/fetch-html.py
输出: docs/migration/html-cache/<序号>.html（已 gitignore，约 200MB）
缓存后转换/校对/返工都不再请求微信。已存在的文件自动跳过，可安全重跑。
"""
import json
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / "html-cache"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def main() -> None:
    arts = json.loads((HERE / "articles.json").read_text(encoding="utf-8"))
    CACHE.mkdir(exist_ok=True)
    ok, fail = 0, []
    for i, a in enumerate(arts):
        out = CACHE / f"{i:02d}.html"
        if out.exists():
            ok += 1
            continue
        try:
            req = urllib.request.Request(a["url"], headers={"User-Agent": UA})
            html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8")
            if "js_content" not in html:
                raise RuntimeError("页面无正文容器（可能是验证页）")
            out.write_text(html, encoding="utf-8")
            ok += 1
            print(f"[{i:02d}] ok  {a['date']}  {a['title']}", flush=True)
        except Exception as e:  # noqa: BLE001 —— 单篇失败不中断全量，最后汇总报告
            fail.append((i, a["title"], str(e)))
            print(f"[{i:02d}] FAIL {a['title']}: {e}", flush=True)
        time.sleep(2)
    print(f"完成: {ok}/{len(arts)}，失败 {len(fail)} 篇")
    for i, t, e in fail:
        print(f"  失败 [{i:02d}] {t}: {e}")


if __name__ == "__main__":
    main()
