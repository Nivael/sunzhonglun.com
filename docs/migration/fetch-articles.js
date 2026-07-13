// 公众号文章清单导出脚本（迁移阶段 0）
//
// 用法：
// 1. 登录公众号后台，打开「发表记录」页：
//    https://mp.weixin.qq.com/cgi-bin/appmsgpublish?sub=list&begin=0&count=10&token=<你的token>&lang=zh_CN
// 2. 按 F12（或 ⌥⌘I）打开开发者工具，切到 Console 标签
// 3. 若 Chrome 提示不允许粘贴，先在控制台输入 allow pasting 回车
// 4. 粘贴本文件全部内容，回车，等进度跑完
// 5. 浏览器会自动下载 articles.json，把它放到本仓库 docs/migration/ 下
//
// 说明：脚本只调用后台自己的列表接口（与页面翻页时完全相同的请求），
// 数据不发往任何第三方，全程在你的浏览器本地完成。

(async () => {
  const token = new URL(location.href).searchParams.get('token');
  if (!token) { console.error('URL 里没有 token，请从后台「发表记录」页运行'); return; }

  // publish_info 是 HTML 实体转义过的 JSON，用 textarea 解码
  const decode = (s) => { const ta = document.createElement('textarea'); ta.innerHTML = s; return ta.value; };
  const toDate = (ts) => new Date((ts + 8 * 3600) * 1000).toISOString().slice(0, 10); // 北京时间日期

  const out = [];
  let total = Infinity;
  for (let begin = 0; begin < total; begin += 10) {
    const resp = await fetch(
      `/cgi-bin/appmsgpublish?sub=list&begin=${begin}&count=10&token=${token}&lang=zh_CN&f=json`,
      { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
    );
    const data = await resp.json();
    if (!data.publish_page) { console.error('接口返回异常（token 可能过期，刷新页面重试）:', data); return; }
    const page = JSON.parse(data.publish_page);
    total = page.total_count;
    for (const item of page.publish_list) {
      if (!item.publish_info) continue;
      const info = JSON.parse(decode(item.publish_info));
      const ts = info.sent_info && info.sent_info.time; // 发表时间（unix 秒）
      for (const a of info.appmsgex || []) {
        const t = ts || a.create_time;
        out.push({ title: a.title, url: a.link, publish_ts: t, date: toDate(t) });
      }
    }
    console.log(`进度：${Math.min(begin + 10, total)}/${total} 条发表记录，累计 ${out.length} 篇文章`);
    await new Promise((r) => setTimeout(r, 500)); // 温和限速，避免触发风控
  }

  console.log(`完成：共 ${out.length} 篇文章`);
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'articles.json';
  a.click();
})();
