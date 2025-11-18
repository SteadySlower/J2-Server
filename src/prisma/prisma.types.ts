import { PrismaService } from './prisma.service';

/**
 * Prisma 트랜잭션 클라이언트 타입
 * 트랜잭션 내에서 사용할 수 있는 Prisma 클라이언트 타입
 *
 * Prisma의 $transaction 콜백 함수의 첫 번째 인자 타입을 추출하여 사용
 */
export type PrismaTransactionClient = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];
