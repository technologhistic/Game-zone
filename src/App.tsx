import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { CountdownOverlay } from './components/CountdownOverlay';
import { GameScreen } from './components/GameScreen';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AchievementsModal } from './components/AchievementsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { RoastLounge } from './components/RoastLounge';
import { RoastWarningModal } from './components/RoastWarningModal';
import { HumorLeaderboardModal } from './components/HumorLeaderboardModal';
import { PlayerProfile, ScreenState, Achievement } from './types/game';
import { getLocalProfile, syncUserProfile, submitScore } from './lib/supabase';
import { sound } from './lib/sound';
import { checkAndUnlockAchievements } from './lib/achievements';

export default function App() {
  const [screenState, setScreenState] = useState<ScreenState>('home');
  const [profile, setProfile] = useState<PlayerProfile>(() => getLocalProfile());
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showRoastWarning, setShowRoastWarning] = useState<boolean>(false);
  const [showHumorLeaderboard, setShowHumorLeaderboard] = useState<boolean>(false);

  // 18+ Consent state
  const [hasConsented18Plus, setHasConsented18Plus] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('catchme_18plus_consent') === 'true';
    }
    return false;
  });

  // Current game results
  const [gameResult, setGameResult] = useState<{
    score: number;
    duration: number;
    catches: number;
    misses: number;
    maxCombo: number;
    difficulty: number;
    newAchievements: Achievement[];
  } | null>(null);

  // Toggle audio
  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  // Start game flow
  const handleStartGame = async (username: string) => {
    const updatedProfile = await syncUserProfile(username);
    setProfile(updatedProfile);
    setScreenState('countdown');
  };

  // 18+ Roast Lounge Entry
  const handleOpenRoast = () => {
    if (!hasConsented18Plus || !profile.username) {
      setShowRoastWarning(true);
    } else {
      setScreenState('roast');
    }
  };

  const handleConfirmRoastWarning = async (confirmedUsername: string) => {
    setShowRoastWarning(false);
    setHasConsented18Plus(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('catchme_18plus_consent', 'true');
    }
    const updated = await syncUserProfile(confirmedUsername);
    setProfile(updated);
    setScreenState('roast');
  };

  // Countdown finished -> active gameplay
  const handleCountdownComplete = () => {
    setScreenState('playing');
  };

  // Game completed
  const handleGameOver = useCallback(
    async (results: {
      score: number;
      duration: number;
      catches: number;
      misses: number;
      maxCombo: number;
      difficulty: number;
      sessionId: string;
    }) => {
      // Check achievements
      const newlyUnlocked = checkAndUnlockAchievements({
        score: results.score,
        catches: results.catches,
        combo: results.maxCombo,
        misses: results.misses,
        duration: results.duration,
        totalGames: profile.total_games + 1,
      });

      // Submit score to Supabase and local storage
      await submitScore({
        username: profile.username || 'Player',
        score: results.score,
        difficulty: results.difficulty,
        duration: results.duration,
        catches: results.catches,
        misses: results.misses,
        max_combo: results.maxCombo,
        sessionId: results.sessionId,
      });

      // Refresh profile state
      const freshProfile = getLocalProfile();
      setProfile(freshProfile);

      setGameResult({
        ...results,
        newAchievements: newlyUnlocked,
      });

      setScreenState('gameover');
    },
    [profile]
  );

  // Abandon game / return to home
  const handleAbandon = () => {
    setScreenState('home');
  };

  // Restart directly
  const handlePlayAgain = () => {
    setGameResult(null);
    setScreenState('countdown');
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* App Header (always visible except during countdown or roast lounge) */}
      {screenState !== 'countdown' && screenState !== 'roast' && (
        <Header
          profile={profile}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenHelp={() => setShowHelp(true)}
          onOpenRoast={handleOpenRoast}
          onHomeClick={() => setScreenState('home')}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        {screenState === 'home' && (
          <HomeScreen
            profile={profile}
            onStartGame={handleStartGame}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenAchievements={() => setShowAchievements(true)}
            onOpenHelp={() => setShowHelp(true)}
            onOpenRoast={handleOpenRoast}
          />
        )}

        {screenState === 'countdown' && (
          <CountdownOverlay onComplete={handleCountdownComplete} />
        )}

        {screenState === 'playing' && (
          <GameScreen
            username={profile.username || 'Player'}
            bestScore={profile.best_score}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
            onGameOver={handleGameOver}
            onAbandon={handleAbandon}
          />
        )}

        {screenState === 'gameover' && gameResult && (
          <GameOverModal
            username={profile.username || 'Player'}
            score={gameResult.score}
            bestScore={profile.best_score}
            catches={gameResult.catches}
            misses={gameResult.misses}
            maxCombo={gameResult.maxCombo}
            newAchievements={gameResult.newAchievements}
            onPlayAgain={handlePlayAgain}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onGoHome={() => setScreenState('home')}
          />
        )}

        {screenState === 'roast' && (
          <RoastLounge
            username={profile.username || 'StageComic'}
            onBackToGame={() => setScreenState('home')}
            onOpenHumorLeaderboard={() => setShowHumorLeaderboard(true)}
          />
        )}
      </main>

      {/* Footer */}
      {screenState !== 'roast' && (
        <footer className="w-full py-3 px-4 border-t border-slate-900/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-2 select-none">
          <span>Game Zone 🎮 — Catch Me & 18+ Roast Lounge</span>
          <span className="hidden sm:inline">•</span>
          <button
            onClick={handleOpenRoast}
            className="text-rose-400 hover:text-rose-300 transition-colors font-medium underline underline-offset-2"
          >
            18+ Dark Humor Roast Lounge 😈
          </button>
        </footer>
      )}

      {/* Modals */}
      {showLeaderboard && (
        <LeaderboardModal
          currentUsername={profile.username}
          onClose={() => setShowLeaderboard(false)}
          onPlayClick={() => {
            setShowLeaderboard(false);
            if (profile.username) {
              setScreenState('countdown');
            } else {
              setScreenState('home');
            }
          }}
        />
      )}

      {showHumorLeaderboard && (
        <HumorLeaderboardModal
          currentUsername={profile.username}
          onClose={() => setShowHumorLeaderboard(false)}
        />
      )}

      {showRoastWarning && (
        <RoastWarningModal
          currentUsername={profile.username}
          onCancel={() => setShowRoastWarning(false)}
          onConfirm={handleConfirmRoastWarning}
        />
      )}

      {showAchievements && (
        <AchievementsModal onClose={() => setShowAchievements(false)} />
      )}

      {showHelp && (
        <HowToPlayModal
          onClose={() => setShowHelp(false)}
          onPlayClick={() => {
            setShowHelp(false);
            if (profile.username) {
              setScreenState('countdown');
            } else {
              setScreenState('home');
            }
          }}
        />
      )}
    </div>
  );
}
