// 访问统计的日期口径：东八区自然日（中国无夏令时，直接偏移 8 小时）
export function dayKeyUtc8(now: number = Date.now()): string {
  return new Date(now + 8 * 3600e3).toISOString().slice(0, 10);
}
