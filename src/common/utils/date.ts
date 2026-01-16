import { DateTime } from 'luxon';

/**
 * 문자열 날짜에서 지정된 일수를 뺍니다.
 * 순수하게 문자열 날짜만 다루며 타임존 문제를 피합니다.
 * @param dateStr YYYY-MM-DD 형식의 날짜 문자열
 * @param days 뺄 일수
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export function subtractDays(dateStr: string, days: number): string {
  const date = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: 'utc' });
  return date.minus({ days }).toISODate()!;
}

/**
 * 문자열 날짜에 지정된 일수를 더합니다.
 * 순수하게 문자열 날짜만 다루며 타임존 문제를 피합니다.
 * @param dateStr YYYY-MM-DD 형식의 날짜 문자열
 * @param days 더할 일수
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export function addDays(dateStr: string, days: number): string {
  const date = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: 'utc' });
  return date.plus({ days }).toISODate()!;
}
