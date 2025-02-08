// types/leaderboard.ts

export interface PlayerScore {
  name: string;
  school: string;
  className: string;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  completedAt: string;
}

export interface GameStats {
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  completedAt: string;
}