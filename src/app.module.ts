import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { WordBooksModule } from './word-books/word-books.module';

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
    AuthModule,
    ProfileModule,
    WordBooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
