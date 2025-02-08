// src/types/word.ts
export interface Word {
  english: string;
  chinese: string;
}

export interface Mistake {
  english: string;
  chinese: string;
  selectedAnswer: string;
}
