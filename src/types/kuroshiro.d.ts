declare module 'kuroshiro' {
  type ConvertMode = 'normal' | 'spaced' | 'okurigana' | 'furigana';
  type ConvertTarget = 'hiragana' | 'katakana' | 'romaji';
  type RomajiSystem = 'nippon' | 'passport' | 'hepburn';

  export type KuroshiroConvertOptions = {
    mode?: ConvertMode;
    to?: ConvertTarget;
    romajiSystem?: RomajiSystem;
    delimiter_start?: string;
    delimiter_end?: string;
  };

  class Kuroshiro {
    init(analyzer: unknown): Promise<void>;
    convert(input: string, options?: KuroshiroConvertOptions): Promise<string>;
  }

  export = Kuroshiro;
}

declare module 'kuroshiro-analyzer-kuromoji' {
  export default class KuromojiAnalyzer {
    constructor(options?: Record<string, unknown>);
  }
}
