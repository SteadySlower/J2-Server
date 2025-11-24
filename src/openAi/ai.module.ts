import { Module } from '@nestjs/common';
import { OpenAiService } from './openAi.service';

@Module({
  providers: [
    {
      provide: 'AI_SERVICE', // 토큰 이름으로 등록
      useClass: OpenAiService, // 실제 구현체
    },
  ],
  exports: ['AI_SERVICE'], // 외부 모듈에서 주입 가능하게 export
})
export class AiModule {}
