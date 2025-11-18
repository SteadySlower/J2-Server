/**
 * 일본어 텍스트에서 한자 문자를 추출
 * @param text 일본어 단어 또는 문장
 * @returns 한자 문자 배열 (중복 제거, 정렬됨)
 */
export function extractKanjiCharacters(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // 한자 유니코드 범위 정규식
  // CJK 통합 한자: \u4E00-\u9FFF
  // CJK 확장 A: \u3400-\u4DBF
  // CJK 호환 한자: \uF900-\uFAFF
  const kanjiRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g;

  const kanjiMatches = text.match(kanjiRegex);

  if (!kanjiMatches) {
    return [];
  }

  // 중복 제거 및 정렬
  const uniqueKanji = Array.from(new Set(kanjiMatches)).sort();

  return uniqueKanji;
}
