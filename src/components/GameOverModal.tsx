import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw, Home, Share2, Award, Flame, Target, Check, Sparkles } from 'lucide-react';
import { Achievement } from '../types/game';
import { fireConfetti } from '../lib/confetti';

interface GameOverModalProps {
  username: string;
  score: number;
  bestScore: number;
  catches: number;
  misses: number;
  maxCombo: number;
  newAchievements: Achievement[];
  onPlayAgain: () => void;
  onOpenLeaderboard: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  username,
  score,
  bestScore,
  catches,
  misses,
  maxCombo,
  newAchievements,
  onPlayAgain,
  onOpenLeaderboard,
  onGoHome,
}) => {
  const [copied, setCopied] = useState(false);
  const isNewRecord = score > 0 && score >= bestScore;

  // Funny roast / praise message based on score
  let resultHeadline = '';
  let resultSub = '';
  let emoji = '😂';

  if (score < 50) {
    emoji = '💀';
    resultHeadline = 'The button won.';
    resultSub = 'Bro was tapping air the entire time. Try using two hands!';
  } else if (score < 150) {
    emoji = '👀';
    resultHeadline = "Okay… you're getting dangerous.";
    resultSub = 'The button felt a slight breeze. Keep pushing!';
  } else if (score < 300) {
    emoji = '⚡';
    resultHeadline = 'WAIT, HOW DID YOU DO THAT?!';
    resultSub = 'Certified reflex machine. The button is getting genuinely worried.';
  } else {
    emoji = '👑';
    resultHeadline = 'THE BUTTON FEARS YOU 💀';
    resultSub = 'God-tier accuracy! The button is currently having an existential crisis.';
  }

  // Calculate accuracy percentage
  const totalTaps = catches + misses;
  const accuracy = totalTaps > 0 ? Math.round((catches / totalTaps) * 100) : 0;

  // Trigger celebration confetti
  useEffect(() => {
    if (isNewRecord || score >= 150) {
      fireConfetti();
    }
  }, [isNewRecord, score]);

  const handleShare = async () => {
    const shareText = `I scored ${score} points in Game Zone 🎮! Can you beat my reflexes?`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Game Zone 🎮 Score',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or fallback
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 text-center shadow-2xl animate-fadeIn my-auto">
        {/* Top Record Alert */}
        {isNewRecord && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold mb-3 tracking-wide animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            NEW PERSONAL BEST!
          </div>
        )}

        {/* Big Score Header */}
        <div className="mb-2">
          <div className="text-4xl sm:text-5xl mb-1">{emoji}</div>
          <h2 className="font-fun text-2xl sm:text-3xl font-extrabold text-white">
            {resultHeadline}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1 px-2">
            {resultSub}
          </p>
        </div>

        {/* Score Box */}
        <div className="my-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Final Score
          </div>
          <div className="font-fun text-5xl sm:text-6xl font-black bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300 bg-clip-text text-transparent my-1">
            {score}
          </div>
          <div className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Your Best: <span className="text-amber-300 font-bold">{bestScore}</span>
          </div>
        </div>

        {/* Match Breakdown Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5 text-center">
          <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Target className="w-3 h-3 text-cyan-400" />
              Catches
            </div>
            <div className="font-fun text-lg font-bold text-slate-100 mt-0.5">{catches}</div>
          </div>

          <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              Max Combo
            </div>
            <div className="font-fun text-lg font-bold text-orange-400 mt-0.5">{maxCombo}x</div>
          </div>

          <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy</div>
            <div className="font-fun text-lg font-bold text-emerald-400 mt-0.5">{accuracy}%</div>
          </div>
        </div>

        {/* Newly Unlocked Achievements in this round */}
        {newAchievements.length > 0 && (
          <div className="mb-5 p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-left">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Award className="w-4 h-4" />
              Achievement Unlocked!
            </div>
            {newAchievements.map((ach) => (
              <div key={ach.id} className="flex items-center gap-2 text-xs text-slate-200 mt-1">
                <span className="text-base">{ach.icon}</span>
                <div>
                  <span className="font-bold text-amber-200">{ach.title}:</span>{' '}
                  <span className="text-slate-400">{ach.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-fun text-lg font-extrabold tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5 fill-slate-950" />
            PLAY AGAIN
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenLeaderboard}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Leaderboard
            </button>

            <button
              onClick={handleShare}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Share Score</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onGoHome}
            className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
