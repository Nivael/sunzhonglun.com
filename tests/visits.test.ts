import { describe, expect, it } from 'vitest';
import { dayKeyUtc8 } from '../src/lib/visits';

describe('dayKeyUtc8 东八区日期口径', () => {
  it('UTC 15:59 仍是东八区当日 23:59', () => {
    expect(dayKeyUtc8(Date.UTC(2026, 6, 19, 15, 59, 59))).toBe('2026-07-19');
  });
  it('UTC 16:00 已是东八区次日 00:00', () => {
    expect(dayKeyUtc8(Date.UTC(2026, 6, 19, 16, 0, 0))).toBe('2026-07-20');
  });
  it('跨年边界', () => {
    expect(dayKeyUtc8(Date.UTC(2026, 11, 31, 16, 0, 0))).toBe('2027-01-01');
  });
});
