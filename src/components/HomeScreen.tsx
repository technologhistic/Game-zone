import React, { useState } from 'react';
import { Play, Trophy, HelpCircle, Award, Sparkles, User, AlertCircle, Flame, Target } from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { validateUsername } from '../lib/supabase';
import { sound } from '../lib/sound';

interface HomeScreenProps {
  profile: PlayerProfile;
  onStartGame: (username: string) => void;
  onOpenLeaderboard: () => void;
  onOpenAchievements: () => void;
  onOpenHelp: () => void;
  onOpenRoast: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  onStartGame,
  onOpenLeaderboard,
  onOpenAchievements,
  onOpenHelp,
  onOpenRoast,
}) => {
  const [usernameInput, setUsernameInput] = useState(profile.username || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fun playful teasing button position on home screen
  const [teaseDodge, setTeaseDodge] = useState({ x: 0, y: 0 });
  const [teaseText, setTeaseText] = useState('TRY CLICKING ME 😏');

  const handleTeaseInteraction = () => {
    sound.playDodge();
    // Random offset between -60 and 60 px
    const newX = (Math.random() - 0.5) * 120;
    const newY = (Math.random() - 0.5) * 80;
    setTeaseDodge({ x: newX, y: newY });

    const roasts = [
      'Too slow! 😜',
      'Nice try! 😂',
      'Enter username first! 👆',
      'You cannot touch this! 💨',
      'Warm up that finger! 💅',
      'Can\'t catch me here either! 🚀',
    ];
    setTeaseText(roasts[Math.floor(Math.random() * roasts.length)]);
  };

  const handlePlaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateUsername(usernameInput);

    if (!result.valid) {
      setErrorMsg(result.error || 'Please enter a valid username');
      sound.playMiss();
      return;
    }

    setErrorMsg(null);
    onStartGame(result.cleanName);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col items-center justify-center flex-1">
      {/* Title & Badge */}
      <div className="text-center mb-6 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3 tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Game Zone & 18+ AI Roast Club</span>
        </div>

        <h1 className="font-fun text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-md">
          Game Zone <span className="inline-block animate-bounce">🎮</span>
        </h1>

        <p className="mt-2 text-slate-300 text-base sm:text-lg font-medium max-w-md mx-auto">
          Catch the world's most evasive button, or step up to the mic in the 18+ Roast Lounge!
        </p>
      </div>

      {/* Mini interactive tease button */}
      <div className="h-16 flex items-center justify-center mb-6 w-full">
        <button
          type="button"
          onMouseEnter={handleTeaseInteraction}
          onTouchStart={handleTeaseInteraction}
          onClick={handleTeaseInteraction}
          style={{
            transform: `translate(${teaseDodge.x}px, ${teaseDodge.y}px)`,
            transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          className="px-5 py-2 rounded-full bg-slate-800/90 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-bold shadow-lg hover:border-amber-400 cursor-pointer active:scale-95"
        >
          {teaseText}
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        <form onSubmit={handlePlaySubmit} className="space-y-5">
          {/* Username Input */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Player Username
              </span>
              <span className="text-[11px] text-slate-500 font-normal">3-20 characters</span>
            </label>

            <div className="relative">
              <input
                id="username"
                type="text"
                maxLength={20}
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. SpeedDemon, NinjaFingers"
                className={`w-full px-4 py-3.5 rounded-2xl bg-slate-950/80 border text-slate-100 placeholder-slate-500 text-base font-medium focus:outline-none transition-all ${
                  errorMsg
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                    : 'border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                }`}
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {errorMsg && (
              <p className="mt-2 text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-fun text-xl sm:text-2xl font-extrabold tracking-wide shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <Play className="w-6 h-6 fill-slate-950 group-hover:scale-110 transition-transform" />
              PLAY NOW
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                LEADERBOARD
              </button>

              <button
                type="button"
                onClick={onOpenRoast}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-950/80 to-purple-950/80 hover:from-rose-900/80 hover:to-purple-900/80 border border-rose-500/40 text-rose-300 font-bold text-xs sm:text-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <span>😈</span>
                <span>ROAST CLUB</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500 text-white font-black">18+</span>
              </button>
            </div>
          </div>
        </form>

        {/* Player Stats preview if available */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="text-[11px] uppercase font-semibold text-slate-400 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              Best
            </div>
            <div className="font-fun text-lg sm:text-xl font-bold text-amber-300 mt-0.5">
              {profile.best_score || 0}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="text-[11px] uppercase font-semibold text-slate-400 flex items-center justify-center gap-1">
              <Target className="w-3 h-3 text-cyan-400" />
              Catches
            </div>
            <div className="font-fun text-lg sm:text-xl font-bold text-cyan-300 mt-0.5">
              {profile.total_catches || 0}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="text-[11px] uppercase font-semibold text-slate-400 flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              Streak
            </div>
            <div className="font-fun text-lg sm:text-xl font-bold text-orange-300 mt-0.5">
              {profile.streak_days || 1}d
            </div>
          </div>
        </div>
      </div>

      {/* Rules / Tip Pill */}
      <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-400">
        <button
          onClick={onOpenHelp}
          className="hover:text-slate-200 transition-colors flex items-center gap-1 underline underline-offset-4 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          How to play & tips
        </button>
        <span>•</span>
        <button
          onClick={onOpenAchievements}
          className="hover:text-slate-200 transition-colors flex items-center gap-1 underline underline-offset-4 cursor-pointer"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          View Achievements
        </button>
      </div>
    </div>
  );
};
