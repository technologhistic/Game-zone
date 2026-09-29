import { Achievement } from '../types/game';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_catch',
    title: 'First Catch! 🎯',
    description: 'Caught the evasive button at least once.',
    icon: '🎯',
    condition: (stats) => stats.catches >= 1,
  },
  {
    id: 'combo_5',
    title: 'On Fire! 🔥',
    description: 'Reached a 5-catch streak combo.',
    icon: '🔥',
    condition: (stats) => stats.combo >= 5,
  },
  {
    id: 'combo_10',
    title: 'Ultra Instinct ⚡',
    description: 'Reached a 10-catch streak combo!',
    icon: '⚡',
    condition: (stats) => stats.combo >= 10,
  },
  {
    id: 'destroyer_15',
    title: 'Button Bully 💪',
    description: 'Caught the button 15 times in a single 30s game.',
    icon: '💪',
    condition: (stats) => stats.catches >= 15,
  },
  {
    id: 'score_200',
    title: 'Getting Dangerous 😎',
    description: 'Scored 200 or more points in one run.',
    icon: '😎',
    condition: (stats) => stats.score >= 200,
  },
  {
    id: 'score_350',
    title: 'The Button Fears You 💀',
    description: 'Scored 350+ points! You broke the button’s spirit.',
    icon: '💀',
    condition: (stats) => stats.score >= 350,
  },
  {
    id: 'sharpshooter',
    title: 'Precision Master 🏹',
    description: 'Finished with fewer than 5 misses and at least 8 catches.',
    icon: '🏹',
    condition: (stats) => stats.catches >= 8 && stats.misses <= 5,
  },
  {
    id: 'veteran',
    title: 'Addicted to the Chase 🕹️',
    description: 'Completed 5 full matches in Game Zone.',
    icon: '🕹️',
    condition: (stats) => stats.totalGames >= 5,
  },
];

const UNLOCKED_KEY = 'catchme_unlocked_achievements';

export function getUnlockedAchievements(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function checkAndUnlockAchievements(stats: {
  score: number;
  catches: number;
  combo: number;
  misses: number;
  duration: number;
  totalGames: number;
}): Achievement[] {
  const currentUnlocked = new Set(getUnlockedAchievements());
  const newlyUnlocked: Achievement[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (!currentUnlocked.has(ach.id) && ach.condition(stats)) {
      currentUnlocked.add(ach.id);
      newlyUnlocked.push(ach);
    }
  }

  if (newlyUnlocked.length > 0 && typeof window !== 'undefined') {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(Array.from(currentUnlocked)));
  }

  return newlyUnlocked;
}
