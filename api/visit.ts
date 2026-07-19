// 访问计数接口（Vercel 根 api/ 目录 serverless 函数，不经 Astro 构建）。
// 存储 Upstash Redis，零 npm 依赖：直接以 fetch 调 REST pipeline。
// 详见 docs/PRD.md §7.5。
// 东八区日期口径，与 src/lib/visits.ts 的 dayKeyUtc8 保持一致
// （不跨边界导入：api/ 由 Vercel 单独打包，不经 Astro/vite）
function dayKeyUtc8(now: number = Date.now()): string {
  return new Date(now + 8 * 3600e3).toISOString().slice(0, 10);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    // 未开通 Redis 时静默降级，前端保持统计区隐藏
    res.status(200).json({ ok: false });
    return;
  }

  const day = dayKeyUtc8();
  const ua = String(req.headers['user-agent'] || '');
  const isBot = /bot|spider|crawl|preview|fetch|monitor|lighthouse/i.test(ua);
  const isProd = process.env.VERCEL_ENV === 'production';
  const shouldCount = req.method === 'POST' && isProd && !isBot;
  const newVisitor = shouldCount && req.body && req.body.newVisitor === true;

  const cmds: string[][] = [];
  if (shouldCount) {
    cmds.push(['INCR', 'pv:total']);
    cmds.push(['INCR', `pv:day:${day}`], ['EXPIRE', `pv:day:${day}`, '259200']);
    if (newVisitor) {
      cmds.push(['INCR', 'uv:total']);
      cmds.push(['INCR', `uv:day:${day}`], ['EXPIRE', `uv:day:${day}`, '259200']);
    }
  }
  cmds.push(['MGET', 'pv:total', `pv:day:${day}`, 'uv:total', `uv:day:${day}`]);

  const r = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) {
    res.status(200).json({ ok: false });
    return;
  }
  const results = await r.json();
  const nums = (results[results.length - 1].result || []).map((v: unknown) => Number(v) || 0);
  res.status(200).json({
    ok: true,
    pvTotal: nums[0],
    pvToday: nums[1],
    uvTotal: nums[2],
    uvToday: nums[3],
  });
}
