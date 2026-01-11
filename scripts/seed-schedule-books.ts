import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

const TEST_MARKER = '(s)';

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

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const daysAgo = dates.length - 1 - i; // 오늘부터 역순으로 계산
      const count = getCountForDay(daysAgo);

      const dateStr = daysAgo === 0 ? '오늘' : `${daysAgo}일 전`;
      console.log(`📆 ${dateStr}: 단어장 ${count}개, 한자장 ${count}개 생성`);

      // 단어장 생성
      for (let j = 0; j < count; j++) {
        await prisma.wordBook.create({
          data: {
            userId,
            title: `${TEST_MARKER} - 단어장 ${dateStr} #${j + 1}`,
            status: 'studying',
            showFront: true,
            createdAt: getStartOfDay(date),
            updatedAt: getStartOfDay(date),
          },
        });
        totalWordBooks++;
      }

      // 한자장 생성
      for (let j = 0; j < count; j++) {
        await prisma.kanjiBook.create({
          data: {
            userId,
            title: `${TEST_MARKER} - 한자장 ${dateStr} #${j + 1}`,
            status: 'studying',
            showFront: true,
            createdAt: getStartOfDay(date),
            updatedAt: getStartOfDay(date),
          },
        });
        totalKanjiBooks++;
      }
    }

    console.log('\n✨ 생성 완료!');
    console.log(`   📚 총 단어장: ${totalWordBooks}개`);
    console.log(`   📖 총 한자장: ${totalKanjiBooks}개`);
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
