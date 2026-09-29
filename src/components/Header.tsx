import React from 'react';
import { Volume2, VolumeX, Trophy, Award, HelpCircle, Flame, FlameKindling } from 'lucide-react';
import { sound } from '../lib/sound';
import { PlayerProfile } from '../types/game';

interface HeaderProps {
  profile: PlayerProfile;
  isMuted: boolean;
  onToggleSound: () => void;
  onOpenLeaderboard: () => void;
  onOpenAchievements: () => void;
  onOpenHelp: () => void;
  onOpenRoast: () => void;
  onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  isMuted,
  onToggleSound,
  onOpenLeaderboard,
  onOpenAchievements,
  onOpenHelp,
  onOpenRoast,
  onHomeClick,
}) => {
  return (
    <header className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3 select-none">
      {/* Logo */}
      <button
        onClick={onHomeClick}
        className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl p-1"
        aria-label="Game Zone Home"
      >
        <span className="text-2xl sm:text-3xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-200">
          🎮
        </span>
        <div>
          <span className="font-fun text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
            Game Zone
          </span>
          <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-md">
            v1.0
          </span>
        </div>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 18+ AI Roast Club Button */}
        <button
          onClick={onOpenRoast}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-purple-500/20 hover:from-rose-500/30 hover:to-purple-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs tracking-tight transition-all active:scale-95 shadow-sm shadow-rose-500/10"
          title="18+ Dark Humor AI Roast Lounge"
          aria-label="Open 18+ Roast Club"
        >
          <span>😈</span>
          <span className="hidden sm:inline">Roast Club</span>
          <span className="text-[10px] px-1 rounded bg-rose-500 text-white font-black">18+</span>
        </button>

        {/* Streak badge */}
        {profile.streak_days > 1 && (
          <div 
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold"
            title={`${profile.streak_days} days daily playing streak!`}
          >
            <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
            <span>{profile.streak_days}d</span>
          </div>
        )}

        {/* Username Chip if set */}
        {profile.username && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[110px]">{profile.username}</span>
          </div>
        )}

        {/* Achievements Button */}
        <button
          onClick={onOpenAchievements}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          title="Achievements"
          aria-label="View Achievements"
        >
          <Award className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Leaderboard Button */}
        <button
          onClick={onOpenLeaderboard}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          title="Game Leaderboard"
          aria-label="View Leaderboard"
        >
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            isMuted
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-emerald-400'
          }`}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Help / Instructions Button */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          title="How to play"
          aria-label="How to play instructions"
        >
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};
