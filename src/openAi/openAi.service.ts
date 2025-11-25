import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import { IAiService } from './ai.interface';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';

@Injectable()
export class OpenAiService implements IAiService {
  private readonly openai: OpenAI;
  private readonly requestTimeoutMs = 10_000;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async getWordsByMeaning(meaning: string): Promise<string[]> {
    const schema = z.object({
      items: z.array(z.string()),
    });
    const systemPrompt = [
      'You are a Japanese dictionary assistant.',
      'When the user provides a Korean word, return up to 3 Japanese words that match its meaning.',
      'All words must be written strictly in Japanese characters (hiragana/katakana/kanji).',
      'Respond only with a JSON string array. Do not include any additional text or explanation.',
    ].join(' ');

    try {
      const response = await this.callWithTimeout(() =>
        this.openai.responses.parse({
          model: 'gpt-4o-mini',
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: meaning },
          ],
          text: {
            format: zodTextFormat(schema, 'japanese_words'),
          },
        }),
      );

      const parsed = response.output_parsed;
      if (!parsed) {
        return this.handleOpenAiError();
      }

      return parsed.items;
    } catch {
      return this.handleOpenAiError();
    }
  }

  async getMeaningsByWord(word: string): Promise<string[]> {
    const schema = z.object({
      items: z.array(z.string()),
    });
    const systemPrompt = [
      'You are a Japanese dictionary assistant.',
      'When the user provides a Japanese word (hiragana/katakana/kanji), return up to 3 Korean meanings.',
      'Respond only with a JSON string array. Do not include any additional text or explanation.',
    ].join(' ');
    try {
      const response = await this.callWithTimeout(() =>
        this.openai.responses.parse({
          model: 'gpt-4o-mini',
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: word },
          ],
          text: {
            format: zodTextFormat(schema, 'korean_meanings'),
          },
        }),
      );
      const parsed = response.output_parsed;
      if (!parsed) {
        return this.handleOpenAiError();
      }
      return parsed.items;
    } catch {
      return this.handleOpenAiError();
    }
  }

  async getWordsByPronunciation(pronunciation: string): Promise<string[]> {
    const schema = z.object({
      items: z.array(z.string()),
    });
    const systemPrompt = [
      'You are a Japanese dictionary assistant.',
      'When the user provides a Korean transcription of a Japanese pronunciation, return up to 3 Japanese words that match the pronunciation.',
      'All words must be strictly in Japanese characters (hiragana/katakana/kanji).',
      'Respond only with a JSON string array. Do not include any additional text or explanation.',
    ].join(' ');
    try {
      const response = await this.callWithTimeout(() =>
        this.openai.responses.parse({
          model: 'gpt-4o-mini',
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: pronunciation },
          ],
          text: {
            format: zodTextFormat(schema, 'japanese_words'),
          },
        }),
      );
      const parsed = response.output_parsed;
      if (!parsed) {
        return this.handleOpenAiError();
      }
      return parsed.items;
    } catch {
      return this.handleOpenAiError();
    }
  }

  private handleOpenAiError(): never {
    throw new Error(
      'AI 서비스 호출 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    );
  }

  private async callWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return await new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('AI 요청이 타임아웃되었습니다.'));
      }, this.requestTimeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          if (error instanceof Error) {
            reject(error);
          } else {
            reject(new Error('알 수 없는 AI 응답 오류가 발생했습니다.'));
          }
        });
    });
  }
}
