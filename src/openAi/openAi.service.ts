import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import { IAiService } from './ai.interface';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';

@Injectable()
export class OpenAiService implements IAiService {
  private readonly openai: OpenAI;

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
      'When the user provides a Korean word, return 1 to 5 Japanese words that match its meaning.',
      'All words must be written strictly in Japanese characters (hiragana/katakana/kanji).',
      'Respond only with a JSON string array. Do not include any additional text or explanation.',
    ].join(' ');

    const response = await this.openai.responses.parse({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: meaning },
      ],
      text: {
        format: zodTextFormat(schema, 'japanese_words'),
      },
    });

    const parsed = response.output_parsed;
    if (!parsed) {
      throw new Error('Failed to parse AI response.');
    }

    return parsed.items;
  }

  async getMeaningsByWord(word: string): Promise<string[]> {
    const schema = z.object({
      items: z.array(z.string()),
    });
    const systemPrompt = [
      'You are a Japanese dictionary assistant.',
      'When the user provides a Japanese word (hiragana/katakana/kanji), return 1 to 5 Korean meanings.',
      'Respond only with a JSON string array. Do not include any additional text or explanation.',
    ].join(' ');
    const response = await this.openai.responses.parse({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: word },
      ],
      text: {
        format: zodTextFormat(schema, 'korean_meanings'),
      },
    });
    const parsed = response.output_parsed;
    if (!parsed) {
      throw new Error('Failed to parse AI response.');
    }
    return parsed.items;
  }

  async getWordsByPronunciation(pronunciation: string): Promise<string[]> {
    const schema = z.object({
      items: z.array(z.string()),
    });
    const systemPrompt = [
      'You are a Japanese dictionary assistant.',
      'When the user provides a Korean transcription of a Japanese pronunciation, return 1 to 5 Japanese words that match the pronunciation.',
      'All words must be strictly in Japanese characters (hiragana/katakana/kanji).',
      'Respond only with a JSON string array. Do not include any additional text or explanation.',
    ].join(' ');
    const response = await this.openai.responses.parse({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: pronunciation },
      ],
      text: {
        format: zodTextFormat(schema, 'japanese_words'),
      },
    });
    const parsed = response.output_parsed;
    if (!parsed) {
      throw new Error('Failed to parse AI response.');
    }
    return parsed.items;
  }
}
