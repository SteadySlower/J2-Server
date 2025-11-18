import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { WordBooksModule } from './word-books/word-books.module';
import { WordsModule } from './words/words.module';
import { KanjiBooksModule } from './kanji-books/kanji-books.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        SUPABASE_JWT_SECRET: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().required(),
      }),
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    WordBooksModule,
    WordsModule,
    KanjiBooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
