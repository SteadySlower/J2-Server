import 'dotenv/config';

const API_BASE_URL = 'http://localhost:4000';

// 환경변수에서 토큰 가져오기
function getAuthToken(): string {
  const token = process.env.SEED_AUTH_TOKEN;

  if (!token) {
    console.error('❌ SEED_AUTH_TOKEN 환경변수가 설정되지 않았습니다.');
    console.error('   .env 파일에 SEED_AUTH_TOKEN=<JWT_TOKEN>를 추가해주세요.');
    process.exit(1);
  }

  return token;
}

// API 호출 헬퍼 함수
async function apiRequest(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<unknown> {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API 요청 실패: ${method} ${endpoint} - ${response.status} ${response.statusText}\n${errorText}`,
    );
  }

  const result = (await response.json()) as {
    ok: boolean;
    data?: unknown;
    error?: string;
  };
  if (!result.ok) {
    throw new Error(`API 응답 오류: ${result.error || '알 수 없는 오류'}`);
  }

  return result.data;
}

// 한자가 포함된 일본어 단어 데이터 (100개)
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

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  console.log('더미 사용자 데이터 생성 시작...\n');
  console.log(`🌐 API 서버: ${API_BASE_URL}\n`);

  const todayDate = getTodayDateString();

  try {
    // 1. 단어장 10개 만들기
    console.log('📚 단어장 생성 중...');
    const wordBooks: Array<{ id: string }> = [];
    for (let i = 1; i <= 10; i++) {
      const wordBook = (await apiRequest('POST', '/word-books', {
        title: `단어장 ${i}`,
        showFront: true,
        created_date: todayDate,
      })) as { id: string };
      wordBooks.push(wordBook);
      console.log(`   ✅ 단어장 ${i} 생성 완료: ${wordBook.id}`);
    }

    // 2. 각 단어장에 단어 10개씩 넣기
    console.log('\n📝 단어 생성 중...');
    let wordIndex = 0;
    for (let i = 0; i < wordBooks.length; i++) {
      const wordBook = wordBooks[i];
      console.log(`   단어장 ${i + 1}에 단어 추가 중...`);

      for (let j = 0; j < 10; j++) {
        if (wordIndex >= dummyWords.length) {
          console.log(`   ⚠️  더 이상 추가할 단어가 없습니다.`);
          break;
        }

        const wordData = dummyWords[wordIndex];
        try {
          // 발음을 API에서 가져오기
          let pronunciation: string | undefined;
          try {
            const pronunciationResult = (await apiRequest(
              'GET',
              `/dictionary/pronunciation?query=${encodeURIComponent(wordData.japanese)}`,
            )) as string;
            pronunciation = pronunciationResult || undefined;
          } catch (pronunciationError: unknown) {
            // 발음 조회 실패 시 undefined로 설정 (선택적 필드이므로 계속 진행)
            console.warn(
              `   ⚠️  발음 조회 실패: ${wordData.japanese}`,
              pronunciationError instanceof Error
                ? pronunciationError.message
                : pronunciationError,
            );
          }

          await apiRequest('POST', '/words', {
            book_id: wordBook.id,
            japanese: wordData.japanese,
            meaning: wordData.meaning,
            ...(pronunciation && { pronunciation }),
          });
          wordIndex++;
        } catch (error: unknown) {
          console.error(`   ❌ 단어 생성 실패: ${wordData.japanese}`, error);
          wordIndex++;
        }
      }
      console.log(`   ✅ 단어장 ${i + 1}에 단어 10개 추가 완료`);
    }

    // 3. 한자장 10개 만들기
    console.log('\n📖 한자장 생성 중...');
    const kanjiBooks: Array<{ id: string }> = [];
    for (let i = 1; i <= 10; i++) {
      const kanjiBook = (await apiRequest('POST', '/kanji-books', {
        title: `한자장 ${i}`,
        showFront: true,
        created_date: todayDate,
      })) as { id: string };
      kanjiBooks.push(kanjiBook);
      console.log(`   ✅ 한자장 ${i} 생성 완료: ${kanjiBook.id}`);
    }

    // 4. 단어 생성 시 자동으로 만들어진 한자들을 조회해서 한자장에 골고루 넣기
    console.log('\n🔗 한자 조회 및 한자장에 추가 중...');
    const allKanjis = (await apiRequest('GET', '/kanjis')) as Array<{
      id: string;
      character: string;
      meaning: string;
      on_reading: string | null;
      kun_reading: string | null;
    }>;
    console.log(`   총 ${allKanjis.length}개의 한자를 찾았습니다.`);

    if (allKanjis.length > 0) {
      // 한자들을 한자장에 골고루 분배
      for (let i = 0; i < allKanjis.length; i++) {
        const kanji = allKanjis[i];
        // 순환적으로 한자장에 할당 (0, 1, 2, ..., 9, 0, 1, ...)
        const kanjiBookIndex = i % kanjiBooks.length;
        const kanjiBook = kanjiBooks[kanjiBookIndex];

        try {
          await apiRequest('POST', '/kanjis', {
            kanji_book_id: kanjiBook.id,
            character: kanji.character,
            meaning: kanji.meaning,
            on_reading: kanji.on_reading || undefined,
            kun_reading: kanji.kun_reading || undefined,
          });
        } catch (error: unknown) {
          // 이미 관계가 존재하는 경우 무시
          if (
            error instanceof Error &&
            error.message.includes(
              '이미 같은 한자 문자가 해당 한자장에 존재합니다',
            )
          ) {
            continue;
          }
          console.error(
            `   ❌ 한자 추가 실패: ${kanji.character} -> 한자장 ${kanjiBookIndex + 1}`,
            error,
          );
        }
      }

      // 각 한자장에 몇 개의 한자가 추가되었는지 확인
      console.log('\n📊 한자장별 한자 개수:');
      for (let i = 0; i < kanjiBooks.length; i++) {
        const kanjiBook = kanjiBooks[i];
        const kanjiBookDetail = (await apiRequest(
          'GET',
          `/kanji-books/${kanjiBook.id}`,
        )) as { kanjis: Array<unknown> };
        const kanjiCount = kanjiBookDetail.kanjis.length;
        console.log(`   한자장 ${i + 1}: ${kanjiCount}개`);
      }
    } else {
      console.log('   ⚠️  추가할 한자가 없습니다.');
    }

    console.log('\n✨ 더미 사용자 데이터 생성 완료!');
  } catch (error: unknown) {
    console.error('❌ 에러 발생:', error);
    throw error;
  }
}

main().catch((e: unknown) => {
  console.error('❌ 에러 발생:', e);
  process.exit(1);
});
