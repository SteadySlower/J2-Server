export interface IAiService {
  getWordsByMeaning(meaning: string): Promise<string[]>;
  getMeaningsByWord(word: string): Promise<string[]>;
  getWordsByPronunciation(pronunciation: string): Promise<string[]>;
}
