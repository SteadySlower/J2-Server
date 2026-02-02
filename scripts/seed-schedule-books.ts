import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

const TEST_MARKER = '(s)';

// 한자가 포함된 일본어 단어 데이터
const dummyWords = [
  { japanese: '漢字', meaning: '한자', pronunciation: 'かんじ' },
  { japanese: '日本語', meaning: '일본어', pronunciation: 'にほんご' },
  { japanese: '学生', meaning: '학생', pronunciation: 'がくせい' },
  { japanese: '先生', meaning: '선생님', pronunciation: 'せんせい' },
  { japanese: '図書館', meaning: '도서관', pronunciation: 'としょかん' },
  { japanese: '学校', meaning: '학교', pronunciation: 'がっこう' },
  { japanese: '会社', meaning: '회사', pronunciation: 'かいしゃ' },
  { japanese: '電話', meaning: '전화', pronunciation: 'でんわ' },
  { japanese: '映画', meaning: '영화', pronunciation: 'えいが' },
  { japanese: '音楽', meaning: '음악', pronunciation: 'おんがく' },
  { japanese: '旅行', meaning: '여행', pronunciation: 'りょこう' },
  { japanese: '料理', meaning: '요리', pronunciation: 'りょうり' },
  { japanese: '勉強', meaning: '공부', pronunciation: 'べんきょう' },
  { japanese: '質問', meaning: '질문', pronunciation: 'しつもん' },
  { japanese: '返事', meaning: '답변', pronunciation: 'へんじ' },
  { japanese: '約束', meaning: '약속', pronunciation: 'やくそく' },
  { japanese: '準備', meaning: '준비', pronunciation: 'じゅんび' },
  { japanese: '練習', meaning: '연습', pronunciation: 'れんしゅう' },
  { japanese: '試験', meaning: '시험', pronunciation: 'しけん' },
  { japanese: '宿題', meaning: '숙제', pronunciation: 'しゅくだい' },
  { japanese: '家族', meaning: '가족', pronunciation: 'かぞく' },
  { japanese: '友達', meaning: '친구', pronunciation: 'ともだち' },
  { japanese: '時間', meaning: '시간', pronunciation: 'じかん' },
  { japanese: '今日', meaning: '오늘', pronunciation: 'きょう' },
  { japanese: '明日', meaning: '내일', pronunciation: 'あした' },
  { japanese: '昨日', meaning: '어제', pronunciation: 'きのう' },
  { japanese: '今週', meaning: '이번 주', pronunciation: 'こんしゅう' },
  { japanese: '来週', meaning: '다음 주', pronunciation: 'らいしゅう' },
  { japanese: '先週', meaning: '지난 주', pronunciation: 'せんしゅう' },
  { japanese: '今月', meaning: '이번 달', pronunciation: 'こんげつ' },
  { japanese: '来月', meaning: '다음 달', pronunciation: 'らいげつ' },
  { japanese: '先月', meaning: '지난 달', pronunciation: 'せんげつ' },
  { japanese: '今年', meaning: '올해', pronunciation: 'ことし' },
  { japanese: '来年', meaning: '내년', pronunciation: 'らいねん' },
  { japanese: '去年', meaning: '작년', pronunciation: 'きょねん' },
  { japanese: '朝', meaning: '아침', pronunciation: 'あさ' },
  { japanese: '昼', meaning: '낮', pronunciation: 'ひる' },
  { japanese: '夜', meaning: '밤', pronunciation: 'よる' },
  { japanese: '午前', meaning: '오전', pronunciation: 'ごぜん' },
  { japanese: '午後', meaning: '오후', pronunciation: 'ごご' },
  { japanese: '朝食', meaning: '아침식사', pronunciation: 'ちょうしょく' },
  { japanese: '昼食', meaning: '점심식사', pronunciation: 'ちゅうしょく' },
  { japanese: '夕食', meaning: '저녁식사', pronunciation: 'ゆうしょく' },
  { japanese: '食事', meaning: '식사', pronunciation: 'しょくじ' },
  { japanese: '飲物', meaning: '음료', pronunciation: 'のみもの' },
  { japanese: '食べ物', meaning: '음식', pronunciation: 'たべもの' },
  { japanese: '水', meaning: '물', pronunciation: 'みず' },
  { japanese: '茶', meaning: '차', pronunciation: 'ちゃ' },
  { japanese: 'コーヒー', meaning: '커피', pronunciation: 'こーひー' },
  { japanese: '紅茶', meaning: '홍차', pronunciation: 'こうちゃ' },
  { japanese: '牛乳', meaning: '우유', pronunciation: 'ぎゅうにゅう' },
  { japanese: '肉', meaning: '고기', pronunciation: 'にく' },
  { japanese: '魚', meaning: '생선', pronunciation: 'さかな' },
  { japanese: '野菜', meaning: '야채', pronunciation: 'やさい' },
  { japanese: '果物', meaning: '과일', pronunciation: 'くだもの' },
  { japanese: '米', meaning: '쌀', pronunciation: 'こめ' },
  { japanese: 'パン', meaning: '빵', pronunciation: 'ぱん' },
  { japanese: '卵', meaning: '계란', pronunciation: 'たまご' },
  { japanese: '車', meaning: '자동차', pronunciation: 'くるま' },
  { japanese: '自転車', meaning: '자전거', pronunciation: 'じてんしゃ' },
  { japanese: '電車', meaning: '전철', pronunciation: 'でんしゃ' },
  { japanese: 'バス', meaning: '버스', pronunciation: 'ばす' },
  { japanese: '飛行機', meaning: '비행기', pronunciation: 'ひこうき' },
  { japanese: '船', meaning: '배', pronunciation: 'ふね' },
  { japanese: '駅', meaning: '역', pronunciation: 'えき' },
  { japanese: '空港', meaning: '공항', pronunciation: 'くうこう' },
  { japanese: '病院', meaning: '병원', pronunciation: 'びょういん' },
  { japanese: '銀行', meaning: '은행', pronunciation: 'ぎんこう' },
  { japanese: '郵便局', meaning: '우체국', pronunciation: 'ゆうびんきょく' },
  { japanese: 'コンビニ', meaning: '편의점', pronunciation: 'こんびに' },
  { japanese: 'スーパー', meaning: '슈퍼마켓', pronunciation: 'すーぱー' },
  { japanese: 'デパート', meaning: '백화점', pronunciation: 'でぱーと' },
  { japanese: '本屋', meaning: '서점', pronunciation: 'ほんや' },
  { japanese: '花屋', meaning: '꽃집', pronunciation: 'はなや' },
  { japanese: '薬局', meaning: '약국', pronunciation: 'やっきょく' },
  { japanese: '美容院', meaning: '미용실', pronunciation: 'びよういん' },
  { japanese: '床屋', meaning: '이발소', pronunciation: 'とこや' },
  { japanese: '公園', meaning: '공원', pronunciation: 'こうえん' },
  { japanese: '動物園', meaning: '동물원', pronunciation: 'どうぶつえん' },
  { japanese: '水族館', meaning: '수족관', pronunciation: 'すいぞくかん' },
  { japanese: '美術館', meaning: '미술관', pronunciation: 'びじゅつかん' },
  { japanese: '博物館', meaning: '박물관', pronunciation: 'はくぶつかん' },
  { japanese: '映画館', meaning: '영화관', pronunciation: 'えいがかん' },
  { japanese: '劇場', meaning: '극장', pronunciation: 'げきじょう' },
  { japanese: 'コンサート', meaning: '콘서트', pronunciation: 'こんさーと' },
  { japanese: 'スポーツ', meaning: '스포츠', pronunciation: 'すぽーつ' },
  { japanese: '野球', meaning: '야구', pronunciation: 'やきゅう' },
  { japanese: 'サッカー', meaning: '축구', pronunciation: 'さっかー' },
  { japanese: 'テニス', meaning: '테니스', pronunciation: 'てにす' },
  {
    japanese: 'バスケットボール',
    meaning: '농구',
    pronunciation: 'ばすけっとぼーる',
  },
  { japanese: '水泳', meaning: '수영', pronunciation: 'すいえい' },
  { japanese: '散歩', meaning: '산책', pronunciation: 'さんぽ' },
  { japanese: '運動', meaning: '운동', pronunciation: 'うんどう' },
  { japanese: '読書', meaning: '독서', pronunciation: 'どくしょ' },
  { japanese: '歌', meaning: '노래', pronunciation: 'うた' },
  { japanese: '踊り', meaning: '춤', pronunciation: 'おどり' },
  { japanese: '写真', meaning: '사진', pronunciation: 'しゃしん' },
  { japanese: '絵', meaning: '그림', pronunciation: 'え' },
  { japanese: '手紙', meaning: '편지', pronunciation: 'てがみ' },
  { japanese: 'メール', meaning: '이메일', pronunciation: 'めーる' },
  {
    japanese: 'インターネット',
    meaning: '인터넷',
    pronunciation: 'いんたーねっと',
  },
  {
    japanese: 'コンピューター',
    meaning: '컴퓨터',
    pronunciation: 'こんぴゅーたー',
  },
  {
    japanese: 'スマートフォン',
    meaning: '스마트폰',
    pronunciation: 'すまーとふぉん',
  },
];

/**
 * 일본어 텍스트에서 한자 문자를 추출
 */
function extractKanjiCharacters(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  const kanjiRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g;
  const kanjiMatches = text.match(kanjiRegex);
  if (!kanjiMatches) {
    return [];
  }
  return Array.from(new Set(kanjiMatches)).sort();
}

/**
 * 3~5 사이의 랜덤 숫자 반환
 */
function getRandomCount(): number {
  return Math.floor(Math.random() * 3) + 3; // 3, 4, 5
}

/**
 * 랜덤으로 learning 또는 learned 반환
 */
function getRandomStatus(): 'learning' | 'learned' {
  return Math.random() < 0.5 ? 'learning' : 'learned';
}

// 사용자 ID를 TEST_USER_UUID 환경변수로 받기
function getUserId(): string {
  const userId = process.env.TEST_USER_UUID;

  if (!userId) {
    console.error('❌ TEST_USER_UUID 환경변수가 설정되지 않았습니다.');
    console.error('   .env 파일에 TEST_USER_UUID=<userId>를 추가해주세요.');
    process.exit(1);
  }

  if (!isValidUUID(userId)) {
    console.error('❌ TEST_USER_UUID 환경변수가 잘못된 UUID 형식입니다.');
    process.exit(1);
  }

  return userId;
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 특정 날짜의 00:00:00 시간을 반환
 */
function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 지그재그 패턴으로 갯수 결정
 * 오늘(0일 전): 2개, 어제(1일 전): 1개, 그 전날(2일 전): 2개, ...
 */
function getCountForDay(daysAgo: number): number {
  return daysAgo % 2 === 0 ? 2 : 1;
}

// Date 객체를 YYYY-MM-DD 형식의 문자열로 변환
function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  const userId = getUserId();
  console.log(`📝 사용자 ID: ${userId}`);
  console.log('📅 Schedule 모듈 테스트용 단어장/한자장 생성 시작...\n');

  try {
    // 1. 기존 테스트용 단어장/한자장 삭제
    console.log('🗑️  기존 테스트용 단어장/한자장 삭제 중...');

    const deletedWordBooks = await prisma.wordBook.deleteMany({
      where: {
        userId,
        title: {
          contains: TEST_MARKER,
        },
      },
    });
    console.log(`   ✅ 단어장 ${deletedWordBooks.count}개 삭제 완료`);

    const deletedKanjiBooks = await prisma.kanjiBook.deleteMany({
      where: {
        userId,
        title: {
          contains: TEST_MARKER,
        },
      },
    });
    console.log(`   ✅ 한자장 ${deletedKanjiBooks.count}개 삭제 완료\n`);

    // 2. 날짜 범위 계산 (2달 전부터 오늘까지)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    twoMonthsAgo.setHours(0, 0, 0, 0);

    // 날짜 배열 생성 (2달 전부터 오늘까지)
    const dates: Date[] = [];
    const currentDate = new Date(twoMonthsAgo);
    while (currentDate <= today) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(
      `📅 생성 기간: ${twoMonthsAgo.toISOString().split('T')[0]} ~ ${today.toISOString().split('T')[0]} (${dates.length}일)\n`,
    );

    // 3. 각 날짜마다 단어장과 한자장 생성
    let totalWordBooks = 0;
    let totalKanjiBooks = 0;
    const createdWordBooks: Array<{ id: string }> = [];
    const createdKanjiBooks: Array<{ id: string }> = [];

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const daysAgo = dates.length - 1 - i; // 오늘부터 역순으로 계산
      const count = getCountForDay(daysAgo);

      const dateStr = daysAgo === 0 ? '오늘' : `${daysAgo}일 전`;
      console.log(`📆 ${dateStr}: 단어장 ${count}개, 한자장 ${count}개 생성`);

      // 단어장 생성
      for (let j = 0; j < count; j++) {
        const wordBook = await prisma.wordBook.create({
          data: {
            userId,
            title: `${TEST_MARKER} - 단어장 ${dateStr} #${j + 1}`,
            status: 'studying',
            showFront: true,
            createdDate: formatDateToString(date),
            createdAt: getStartOfDay(date),
            updatedAt: getStartOfDay(date),
          },
        });
        createdWordBooks.push(wordBook);
        totalWordBooks++;
      }

      // 한자장 생성
      for (let j = 0; j < count; j++) {
        const kanjiBook = await prisma.kanjiBook.create({
          data: {
            userId,
            title: `${TEST_MARKER} - 한자장 ${dateStr} #${j + 1}`,
            status: 'studying',
            showFront: true,
            createdDate: formatDateToString(date),
            createdAt: getStartOfDay(date),
            updatedAt: getStartOfDay(date),
          },
        });
        createdKanjiBooks.push(kanjiBook);
        totalKanjiBooks++;
      }
    }

    console.log('\n📝 단어 및 한자 추가 중...');

    // 4. 각 단어장에 3~5개의 단어 추가
    let wordIndex = 0;
    let totalWords = 0;
    const createdKanjis = new Map<string, string>(); // character -> kanjiId

    for (let i = 0; i < createdWordBooks.length; i++) {
      const wordBook = createdWordBooks[i];
      const wordCount = getRandomCount();
      const wordsToAdd: Array<{
        japanese: string;
        meaning: string;
        pronunciation: string | null;
        status: 'learning' | 'learned';
        kanjiCharacters: string[];
      }> = [];

      // 단어 선택 및 한자 추출
      for (let j = 0; j < wordCount; j++) {
        if (wordIndex >= dummyWords.length) {
          wordIndex = 0; // 순환
        }
        const wordData = dummyWords[wordIndex];
        const kanjiCharacters = extractKanjiCharacters(wordData.japanese);
        wordsToAdd.push({
          japanese: wordData.japanese,
          meaning: wordData.meaning,
          pronunciation: wordData.pronunciation || null,
          status: getRandomStatus(),
          kanjiCharacters,
        });
        wordIndex++;
      }

      // 단어 생성 및 한자 처리
      for (const wordData of wordsToAdd) {
        try {
          // 단어 생성
          const word = await prisma.word.create({
            data: {
              bookId: wordBook.id,
              japanese: wordData.japanese,
              meaning: wordData.meaning,
              pronunciation: wordData.pronunciation,
              status: wordData.status,
            },
          });

          // 한자 생성 및 관계 설정
          for (const character of wordData.kanjiCharacters) {
            let kanjiId = createdKanjis.get(character);

            if (!kanjiId) {
              // 한자가 아직 생성되지 않았으면 생성
              // 한자 사전에서 정보 조회
              const kanjiDict = await prisma.kanjiDictionary.findUnique({
                where: { character },
              });

              // 기존 한자 확인
              const existingKanji = await prisma.kanji.findUnique({
                where: {
                  userId_character: {
                    userId,
                    character,
                  },
                },
              });

              if (existingKanji) {
                kanjiId = existingKanji.id;
              } else {
                // 새 한자 생성
                const kanji = await prisma.kanji.create({
                  data: {
                    userId,
                    character,
                    meaning: kanjiDict?.meaning || '',
                    onReading: kanjiDict?.onReading || null,
                    kunReading: kanjiDict?.kunReading || null,
                    status: getRandomStatus(),
                  },
                });
                kanjiId = kanji.id;
              }
              createdKanjis.set(character, kanjiId);
            }

            // Word-Kanji 관계 생성
            try {
              await prisma.wordKanji.create({
                data: {
                  wordId: word.id,
                  kanjiId,
                },
              });
            } catch (error: unknown) {
              // 관계가 이미 존재하는 경우 무시
              if (
                error &&
                typeof error === 'object' &&
                'code' in error &&
                (error as { code: string }).code === 'P2002'
              ) {
                // 중복 관계 에러는 무시
              } else {
                throw error;
              }
            }
          }

          totalWords++;
        } catch (error: unknown) {
          console.error(
            `   ⚠️  단어 생성 실패: ${wordData.japanese}`,
            error instanceof Error ? error.message : error,
          );
        }
      }
    }

    console.log(`   ✅ 총 ${totalWords}개의 단어 추가 완료`);

    // 5. 각 한자장에 3~5개의 한자 추가
    const allKanjiIds = Array.from(createdKanjis.values());
    let totalKanjiRelations = 0;

    for (let i = 0; i < createdKanjiBooks.length; i++) {
      const kanjiBook = createdKanjiBooks[i];
      const kanjiCount = getRandomCount();
      const kanjisToAdd = allKanjiIds
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(kanjiCount, allKanjiIds.length));

      for (const kanjiId of kanjisToAdd) {
        try {
          await prisma.kanjiKanjiBook.create({
            data: {
              kanjiId,
              kanjiBookId: kanjiBook.id,
            },
          });
          totalKanjiRelations++;
        } catch (error: unknown) {
          // 관계가 이미 존재하는 경우 무시
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            (error as { code: string }).code === 'P2002'
          ) {
            // 중복 관계 에러는 무시
          } else {
            console.error(
              `   ⚠️  한자 추가 실패: kanjiId=${kanjiId}, kanjiBookId=${kanjiBook.id}`,
              error instanceof Error ? error.message : error,
            );
          }
        }
      }
    }

    console.log(
      `   ✅ 총 ${totalKanjiRelations}개의 한자-한자장 관계 추가 완료`,
    );

    console.log('\n✨ 생성 완료!');
    console.log(`   📚 총 단어장: ${totalWordBooks}개`);
    console.log(`   📖 총 한자장: ${totalKanjiBooks}개`);
    console.log(`   📝 총 단어: ${totalWords}개`);
    console.log(`   🔤 총 한자: ${createdKanjis.size}개`);
  } catch (error: unknown) {
    console.error('❌ 에러 발생:', error);
    throw error;
  }
}

main()
  .catch((e: unknown) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
