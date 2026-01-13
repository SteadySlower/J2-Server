/**
 * 오늘 날짜를 반환합니다 (시간은 00:00:00으로 설정).
 * 날짜 비교 시 시간을 제외하고 날짜만 비교하기 위해 사용됩니다.
 * @returns 오늘 날짜 (시간: 00:00:00)
 */
export function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
