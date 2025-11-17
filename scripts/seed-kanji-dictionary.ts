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

async function main() {
  console.log('한자 사전 데이터 삽입 시작...');

  // JSON 파일 읽기
  const jsonPath = path.join(__dirname, '../kanji_data/kanjiList.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`파일을 찾을 수 없습니다: ${jsonPath}`);
    process.exit(1);
  }

  const kanjiData: Record<string, KanjiData> = JSON.parse(
    fs.readFileSync(jsonPath, 'utf-8'),
  ) as Record<string, KanjiData>;

  // 데이터 변환
  const kanjiEntries = Object.entries(kanjiData).map(([character, data]) => ({
    character,
    meaning: data.meaning || '',
    onReading: data.ondoku && data.ondoku.trim() !== '' ? data.ondoku : null,
    kunReading:
      data.kundoku && data.kundoku.trim() !== '' ? data.kundoku : null,
  }));

  console.log(`총 ${kanjiEntries.length}개의 한자 데이터를 삽입합니다...`);

  // 배치 처리 (한 번에 너무 많이 삽입하지 않도록)
  const batchSize = 1000;
  let inserted = 0;

  for (let i = 0; i < kanjiEntries.length; i += batchSize) {
    const batch = kanjiEntries.slice(i, i + batchSize);
    const result = await prisma.kanjiDictionary.createMany({
      data: batch,
      skipDuplicates: true, // 중복된 character가 있으면 건너뛰기
    });
    inserted += batch.length;
    console.log(
      `진행 중: ${inserted}/${kanjiEntries.length} (삽입: ${result.count})`,
    );
  }

  console.log('한자 사전 데이터 삽입 완료!');
}

main()
  .catch((e: unknown) => {
    console.error('에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
