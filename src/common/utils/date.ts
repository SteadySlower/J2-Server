import { DateTime } from 'luxon';

/**
 * 오늘 날짜를 반환합니다 (로컬 타임존 기준, 시간은 00:00:00으로 설정).
 * 날짜 비교 시 시간을 제외하고 날짜만 비교하기 위해 사용됩니다.
 * Luxon을 사용하여 로컬 타임존을 안전하게 처리합니다.
 * @returns 오늘 날짜 (로컬 타임존 기준, 시간: 00:00:00)
 */
export function getTodayDate(): Date {
  const today = DateTime.local().startOf('day').toJSDate();
  return today;
}

/**
 * 날짜가 오늘인지 확인합니다 (날짜만 비교, 시간 무시, 로컬 타임존 기준).
 * @param date 비교할 날짜
 * @returns 오늘이면 true, 아니면 false
 */
export function isToday(date: Date): boolean {
  const today = DateTime.local().startOf('day');
  const targetDate = DateTime.fromJSDate(date).startOf('day');
  return today.hasSame(targetDate, 'day');
}
