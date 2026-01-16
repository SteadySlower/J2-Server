import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface KanjiData {
  meaning: string;
  ondoku: string;
  kundoku: string;
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

// Date 객체를 YYYY-MM-DD 형식의 문자열로 변환
function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 더미 한자장 데이터 (10개, 각각 100개 한자)
const dummyKanjiBooks = Array.from({ length: 10 }, (_, i) => ({
  title: `한자장 ${i + 1}`,
  status: 'studying' as const,
  kanjiCount: 100,
}));

async function main() {
  const userId = getUserId();
  console.log(`📝 사용자 ID: ${userId}`);
  console.log('한자장 및 한자 더미데이터 생성 시작...\n');

  // JSON 파일 읽기
  const jsonPath = path.join(__dirname, '../kanji_data/kanjiList.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${jsonPath}`);
    process.exit(1);
  }

  const kanjiData: Record<string, KanjiData> = JSON.parse(
    fs.readFileSync(jsonPath, 'utf-8'),
  ) as Record<string, KanjiData>;

  // 한자 목록을 배열로 변환
  const kanjiEntries = Object.entries(kanjiData).map(([character, data]) => ({
    character,
    meaning: data.meaning || '',
    onReading: data.ondoku && data.ondoku.trim() !== '' ? data.ondoku : null,
    kunReading:
      data.kundoku && data.kundoku.trim() !== '' ? data.kundoku : null,
  }));

  console.log(
    `📚 총 ${kanjiEntries.length}개의 한자 데이터를 사용할 수 있습니다.\n`,
  );

  // 사용자가 이미 존재하는지 확인 (Profile 테이블 확인)
  const existingProfile = await prisma.profile.findFirst({
    where: { userId },
  });

  if (!existingProfile) {
    console.log('⚠️  해당 사용자의 프로필이 없습니다.');
    console.log('   (프로필이 없어도 더미데이터는 생성됩니다.)\n');
  }

  // 각 한자장마다 별도의 트랜잭션으로 생성 (타임아웃 방지)
  try {
    const createdBooks: Array<{
      id: string;
      title: string;
      kanjiIds: string[];
    }> = [];

    let kanjiIndex = 0; // 한자 목록의 현재 인덱스

    for (const bookData of dummyKanjiBooks) {
      // 각 한자장마다 별도의 트랜잭션 사용 (타임아웃 60초로 설정)
      const result = await prisma.$transaction(
        async (tx) => {
          // 한자장 생성
          const kanjiBook = await tx.kanjiBook.create({
            data: {
              userId,
              title: bookData.title,
              status: bookData.status,
              showFront: true,
              createdDate: formatDateToString(new Date()),
            },
          });

          console.log(
            `📖 한자장 생성: ${bookData.title} (${bookData.kanjiCount}개 한자 예정)`,
          );

          // 해당 한자장에 들어갈 한자 선택 (순서대로 100개씩)
          const selectedKanjis = kanjiEntries.slice(
            kanjiIndex,
            kanjiIndex + bookData.kanjiCount,
          );
          kanjiIndex += bookData.kanjiCount;

          // 한자 생성 및 한자장과의 관계 생성 (중복 방지)
          const kanjiIds: string[] = [];

          for (const kanjiData of selectedKanjis) {
            try {
              // 이미 사용자가 같은 한자를 가지고 있는지 확인
              const existingKanji = await tx.kanji.findUnique({
                where: {
                  userId_character: {
                    userId,
                    character: kanjiData.character,
                  },
                },
              });

              let kanjiId: string;

              if (existingKanji) {
                // 이미 존재하면 기존 한자 사용
                kanjiId = existingKanji.id;
              } else {
                // 새로 생성
                const createdKanji = await tx.kanji.create({
                  data: {
                    userId,
                    character: kanjiData.character,
                    meaning: kanjiData.meaning,
                    onReading: kanjiData.onReading,
                    kunReading: kanjiData.kunReading,
                    status: 'learning',
                  },
                });
                kanjiId = createdKanji.id;
              }

              // 한자장과 한자의 관계 생성 (이미 존재하면 무시)
              try {
                await tx.kanjiKanjiBook.create({
                  data: {
                    kanjiId,
                    kanjiBookId: kanjiBook.id,
                  },
                });
                kanjiIds.push(kanjiId);
              } catch (relationError: unknown) {
                // 관계가 이미 존재하는 경우 무시하고 계속 진행
                if (
                  relationError &&
                  typeof relationError === 'object' &&
                  'code' in relationError &&
                  (relationError as { code: string }).code === 'P2002'
                ) {
                  // 관계 중복 에러는 무시하고 kanjiId는 추가
                  kanjiIds.push(kanjiId);
                  continue;
                }
                throw relationError;
              }
            } catch (error: unknown) {
              // 중복 등 에러는 무시하고 계속 진행
              if (
                error &&
                typeof error === 'object' &&
                'code' in error &&
                (error as { code: string }).code === 'P2002'
              ) {
                // 중복 에러는 무시
                continue;
              }
              throw error;
            }
          }

          return {
            id: kanjiBook.id,
            title: kanjiBook.title,
            kanjiIds,
          };
        },
        {
          maxWait: 60000, // 최대 대기 시간 60초
          timeout: 60000, // 타임아웃 60초
        },
      );

      createdBooks.push(result);

      console.log(
        `   ✅ 완료: ${result.kanjiIds.length}개의 한자가 추가되었습니다.\n`,
      );
    }

    console.log('\n✨ 더미데이터 생성 완료!\n');
    console.log('생성된 한자장:');
    createdBooks.forEach((book) => {
      console.log(`  - ${book.title}: ${book.kanjiIds.length}개 한자`);
    });
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
