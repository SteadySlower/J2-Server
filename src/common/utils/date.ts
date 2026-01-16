import { DateTime } from 'luxon';

/**
 * YYYY-MM-DD 형식의 날짜 문자열이 유효한 날짜인지 검증합니다.
 * @param dateStr YYYY-MM-DD 형식의 날짜 문자열
 * @returns 유효한 날짜이면 true, 그렇지 않으면 false
 */
export function isValidDateString(dateStr: string): boolean {
  // 형식 검증
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  // 실제 날짜 유효성 검증
  const date = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: 'utc' });
  if (!date.isValid) {
    return false;
  }

  // 입력된 문자열과 파싱된 날짜가 일치하는지 확인 (예: 2026-13-45 같은 경우 방지)
  const parsedDateStr = date.toISODate();
  return parsedDateStr === dateStr;
}

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
