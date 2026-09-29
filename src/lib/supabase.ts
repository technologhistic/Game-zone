import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { GameScore, PlayerProfile } from '../types/game';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-supabase-anon')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Local Storage Keys for real player scores & profiles
const LOCAL_PROFILE_KEY = 'catchme_local_profile';
const LOCAL_SCORES_KEY = 'catchme_real_scores';
const LOCAL_BEST_SCORE_KEY = 'catchme_best_score';
const SUBMITTED_SESSIONS_KEY = 'catchme_submitted_sessions';

// Cleanup old legacy seeded scores if present in user browser storage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('catchme_local_scores'); // purge legacy seed key
  } catch {}
}

/**
 * Username validation helper
 * Requirements: 3-20 characters, letters, numbers, spaces, '_' and '-', trimmed, no script injection
 */
export function validateUsername(name: string): { valid: boolean; error?: string; cleanName: string } {
  const cleanName = name.trim().replace(/\s+/g, ' ');

  if (!cleanName) {
    return { valid: false, error: 'Username cannot be empty! 😂', cleanName: '' };
  }

  if (cleanName.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.', cleanName };
  }

  if (cleanName.length > 20) {
    return { valid: false, error: 'Username must be under 20 characters.', cleanName };
  }

  // Check valid characters
  const validCharsRegex = /^[a-zA-Z0-9 _-]+$/;
  if (!validCharsRegex.test(cleanName)) {
    return { valid: false, error: 'Only letters, numbers, spaces, _ and - allowed.', cleanName };
  }

  return { valid: true, cleanName };
}

/**
 * Get or create local user profile
 */
export function getLocalProfile(): PlayerProfile {
  if (typeof window === 'undefined') {
    return { id: 'temp', username: 'Guest', best_score: 0, total_games: 0, total_catches: 0, streak_days: 1 };
  }

  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // update streak if applicable
      return updateStreak(parsed);
    }
  } catch {}

  const newProfile: PlayerProfile = {
    id: crypto.randomUUID ? crypto.randomUUID() : 'user_' + Math.random().toString(36).substring(2, 9),
    username: '',
    best_score: 0,
    total_games: 0,
    total_catches: 0,
    last_played: new Date().toISOString(),
    streak_days: 1,
  };
  saveLocalProfile(newProfile);
  return newProfile;
}

export function saveLocalProfile(profile: PlayerProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

function updateStreak(profile: PlayerProfile): PlayerProfile {
  if (!profile.last_played) return profile;
  const lastDate = new Date(profile.last_played);
  const now = new Date();
  const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 3600);

  // If played yesterday (between 20 and 48 hours ago), streak + 1
  if (diffHours >= 20 && diffHours <= 48) {
    profile.streak_days = (profile.streak_days || 1) + 1;
    profile.last_played = now.toISOString();
    saveLocalProfile(profile);
  } else if (diffHours > 48) {
    // Missed a day
    profile.streak_days = 1;
    profile.last_played = now.toISOString();
    saveLocalProfile(profile);
  }
  return profile;
}

/**
 * Ensure user is authenticated with Supabase (using anonymous auth or session)
 */
export async function authenticateUser(): Promise<User | null> {
  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return session.user;
    }

    // Try signing in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('Anonymous sign-in not enabled on Supabase or failed:', error.message);
      return null;
    }
    return data.user;
  } catch (err) {
    console.warn('Supabase auth error:', err);
    return null;
  }
}

/**
 * Save or update user profile in Supabase & Local
 */
export async function syncUserProfile(username: string): Promise<PlayerProfile> {
  const profile = getLocalProfile();
  profile.username = username;
  profile.last_played = new Date().toISOString();
  saveLocalProfile(profile);

  if (supabase) {
    try {
      const user = await authenticateUser();
      const userId = user?.id || profile.id;

      // Upsert profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            username,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) {
        console.warn('Could not sync profile to Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Profile sync exception:', err);
    }
  }

  return profile;
}

/**
 * Anti-Cheat validation
 */
export function validateGameScore(payload: {
  score: number;
  duration: number;
  catches: number;
  misses: number;
  max_combo: number;
  sessionId: string;
}): { valid: boolean; reason?: string } {
  // Check duplicate session submission
  if (typeof window !== 'undefined') {
    try {
      const rawSubmitted = localStorage.getItem(SUBMITTED_SESSIONS_KEY);
      const submittedList: string[] = rawSubmitted ? JSON.parse(rawSubmitted) : [];
      if (submittedList.includes(payload.sessionId)) {
        return { valid: false, reason: 'Duplicate game session submission detected!' };
      }
    } catch {}
  }

  // Realistic checks
  if (payload.score < 0) {
    return { valid: false, reason: 'Score cannot be negative.' };
  }

  if (payload.duration < 15) {
    return { valid: false, reason: 'Game ended too quickly.' };
  }

  // In 30 seconds, maximum human physical click rate on an evasive button is ~1-1.2 catches per sec (at most ~36 catches)
  // Max realistic score with high combo bonus: ~800-1000 points.
  if (payload.score > 1200 || payload.catches > 45) {
    return { valid: false, reason: 'Score exceeds human speed limits.' };
  }

  // Combo cannot exceed total catches
  if (payload.max_combo > payload.catches) {
    return { valid: false, reason: 'Inconsistent combo count.' };
  }

  return { valid: true };
}

/**
 * Submit game score
 */
export async function submitScore(data: {
  username: string;
  score: number;
  difficulty: number;
  duration: number;
  catches: number;
  misses: number;
  max_combo: number;
  sessionId: string;
}): Promise<{ success: boolean; scoreId?: string; isLocalFallback?: boolean; error?: string }> {
  // Validate anti-cheat
  const validation = validateGameScore(data);
  if (!validation.valid) {
    return { success: false, error: validation.reason || 'Invalid score submission.' };
  }

  // Mark session as submitted
  if (typeof window !== 'undefined') {
    try {
      const rawSubmitted = localStorage.getItem(SUBMITTED_SESSIONS_KEY);
      const submittedList: string[] = rawSubmitted ? JSON.parse(rawSubmitted) : [];
      submittedList.push(data.sessionId);
      // Keep last 50 sessions
      if (submittedList.length > 50) submittedList.shift();
      localStorage.setItem(SUBMITTED_SESSIONS_KEY, JSON.stringify(submittedList));
    } catch {}
  }

  // Update local profile stats
  const profile = getLocalProfile();
  profile.total_games += 1;
  profile.total_catches += data.catches;
  if (data.score > profile.best_score) {
    profile.best_score = data.score;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_BEST_SCORE_KEY, String(data.score));
    }
  }
  saveLocalProfile(profile);

  // Prepare score record
  const newScoreRecord: GameScore = {
    id: crypto.randomUUID ? crypto.randomUUID() : 'score_' + Math.random().toString(36).substring(2, 9),
    username: data.username,
    score: data.score,
    difficulty: data.difficulty,
    duration: data.duration,
    catches: data.catches,
    misses: data.misses,
    max_combo: data.max_combo,
    created_at: new Date().toISOString(),
  };

  // Save to local storage first (ensures immediate responsiveness and offline resilience)
  saveScoreToLocal(newScoreRecord);

  // Try submitting to Supabase
  if (supabase) {
    try {
      const user = await authenticateUser();
      const userId = user?.id || profile.id;

      const { data: inserted, error } = await supabase
        .from('game_scores')
        .insert({
          id: newScoreRecord.id,
          user_id: userId,
          username: data.username,
          score: data.score,
          difficulty: data.difficulty,
          duration: data.duration,
          catches: data.catches,
          max_combo: data.max_combo,
          session_id: data.sessionId,
          created_at: newScoreRecord.created_at,
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase score insert notice:', error.message);
        return { success: true, isLocalFallback: true, scoreId: newScoreRecord.id };
      }

      return { success: true, isLocalFallback: false, scoreId: inserted.id };
    } catch (err) {
      console.warn('Supabase submission failed, saved locally:', err);
      return { success: true, isLocalFallback: true, scoreId: newScoreRecord.id };
    }
  }

  return { success: true, isLocalFallback: true, scoreId: newScoreRecord.id };
}

function saveScoreToLocal(score: GameScore): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_SCORES_KEY);
    const list: GameScore[] = raw ? JSON.parse(raw) : [];
    // Ensure no fake seeds sneak in
    const realOnly = list.filter((s) => !s.id.startsWith('seed-') && !s.id.startsWith('today-seed-'));
    realOnly.push(score);
    // Sort by score desc, then date desc
    realOnly.sort((a, b) => b.score - a.score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // Store up to 100 real scores
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(realOnly.slice(0, 100)));
  } catch {}
}

/**
 * Fetch Leaderboard (All-Time or Daily)
 */
export async function fetchLeaderboard(options: {
  daily?: boolean;
  limit?: number;
}): Promise<{ scores: GameScore[]; isLocalFallback: boolean; error?: string }> {
  const limit = options.limit || 50;
  const isDaily = Boolean(options.daily);

  // Calculate start of day in ISO string
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayIso = startOfDay.toISOString();

  // Try Supabase first if available
  if (supabase) {
    try {
      let query = supabase
        .from('game_scores')
        .select('id, user_id, username, score, difficulty, duration, catches, max_combo, created_at')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (isDaily) {
        query = query.gte('created_at', startOfDayIso);
      }

      const { data, error } = await query;

      if (!error && data) {
        return {
          scores: data.map((d) => ({
            id: d.id,
            user_id: d.user_id,
            username: d.username || 'Anonymous',
            score: d.score,
            difficulty: d.difficulty,
            duration: d.duration,
            catches: d.catches || 0,
            misses: 0,
            max_combo: d.max_combo || 0,
            created_at: d.created_at,
          })),
          isLocalFallback: false,
        };
      }
    } catch (err) {
      console.warn('Leaderboard fetch from Supabase failed, falling back to local:', err);
    }
  }

  // Real player local scores fallback
  return {
    scores: getLocalLeaderboard(isDaily, limit),
    isLocalFallback: true,
  };
}

function getLocalLeaderboard(isDaily: boolean, limit: number): GameScore[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_SCORES_KEY);
    let list: GameScore[] = raw ? JSON.parse(raw) : [];

    // Filter out any legacy fake seed data
    list = list.filter((s) => !s.id.startsWith('seed-') && !s.id.startsWith('today-seed-'));

    if (isDaily) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      list = list.filter((item) => new Date(item.created_at) >= todayStart);
    }

    list.sort((a, b) => b.score - a.score || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return list.slice(0, limit);
  } catch {
    return [];
  }
}
