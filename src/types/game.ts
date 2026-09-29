export interface GameScore {
  id: string;
  user_id?: string;
  username: string;
  score: number;
  difficulty: number;
  duration: number; // in seconds
  catches: number;
  misses: number;
  max_combo: number;
  created_at: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  best_score: number;
  total_games: number;
  total_catches: number;
  last_played?: string;
  streak_days: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  condition: (stats: {
    score: number;
    catches: number;
    combo: number;
    misses: number;
    duration: number;
    totalGames: number;
  }) => boolean;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color?: string;
  type?: 'score' | 'roast' | 'combo' | 'bonus';
}

export type ScreenState = 'home' | 'countdown' | 'playing' | 'gameover' | 'leaderboard' | 'roast';

export interface HumorScore {
  id: string;
  username: string;
  score: number;
  title: string;
  bestPunchline: string;
  created_at: string;
}

export interface RoastMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  humorScore?: number;
  humorTitle?: string;
  critique?: string;
  timestamp: string;
}
