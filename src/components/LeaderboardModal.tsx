import React, { useState, useEffect } from 'react';
import { Trophy, X, RefreshCw, Calendar, Flame, AlertCircle, Cloud, HardDrive, Medal } from 'lucide-react';
import { GameScore } from '../types/game';
import { fetchLeaderboard, isSupabaseConfigured } from '../lib/supabase';

interface LeaderboardModalProps {
  currentUsername: string;
  onClose: () => void;
  onPlayClick: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  currentUsername,
  onClose,
  onPlayClick,
}) => {
  const [tab, setTab] = useState<'all' | 'daily'>('all');
  const [limit, setLimit] = useState<number>(10);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocalFallback, setIsLocalFallback] = useState<boolean>(false);

  const loadLeaderboard = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchLeaderboard({
        daily: tab === 'daily',
        limit,
      });
      setScores(res.scores);
      setIsLocalFallback(res.isLocalFallback);
    } catch {
      setErrorMsg('Oops! The leaderboard is taking a quick nap 😂');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [tab, limit]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-fun text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                Leaderboard 🏆
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                {isSupabaseConfigured && !isLocalFallback ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Cloud className="w-3 h-3" /> Live Supabase Cloud
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                    <HardDrive className="w-3 h-3 text-amber-400" /> Real Player Scores
                  </span>
                )}
                {!loading && scores.length > 0 && (
                  <span className="text-slate-500">• {scores.length} recorded</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLeaderboard}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab & Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3">
          {/* Daily vs All-Time */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tab === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All-Time
            </button>
            <button
              onClick={() => setTab('daily')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                tab === 'daily'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Today
            </button>
          </div>

          {/* Top 10 vs Top 50 */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setLimit(10)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                limit === 10
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top 10
            </button>
            <button
              onClick={() => setLimit(50)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                limit === 50
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top 50
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[380px] rounded-2xl bg-slate-950/60 border border-slate-800/80 divide-y divide-slate-800/50">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
              <p className="text-xs font-medium">Scanning the leaderboard records...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-8 text-center space-y-2">
              <AlertCircle className="w-7 h-7 text-rose-400 mx-auto" />
              <p className="text-xs text-rose-300 font-semibold">{errorMsg}</p>
              <button
                onClick={loadLeaderboard}
                className="mt-2 text-xs text-amber-400 underline"
              >
                Try Again
              </button>
            </div>
          ) : scores.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="text-4xl">🏆</div>
              <h4 className="font-fun font-bold text-white text-base">
                {tab === 'daily' ? 'No scores recorded today yet!' : 'No player scores submitted yet!'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Only real players appear here. Be the very first champion to catch the button and claim #1 on the leaderboard!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onPlayClick();
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-fun font-bold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95"
              >
                Set the First Record 🚀
              </button>
            </div>
          ) : (
            scores.map((entry, index) => {
              const rank = index + 1;
              const isCurrentPlayer =
                currentUsername &&
                entry.username.toLowerCase() === currentUsername.trim().toLowerCase();

              let rankBadge = (
                <span className="font-fun text-xs font-bold text-slate-400">#{rank}</span>
              );

              if (rank === 1) {
                rankBadge = (
                  <span className="text-base" title="1st Place">
                    🥇
                  </span>
                );
              } else if (rank === 2) {
                rankBadge = (
                  <span className="text-base" title="2nd Place">
                    🥈
                  </span>
                );
              } else if (rank === 3) {
                rankBadge = (
                  <span className="text-base" title="3rd Place">
                    🥉
                  </span>
                );
              }

              return (
                <div
                  key={entry.id || index}
                  className={`px-4 py-2.5 flex items-center justify-between text-xs transition-colors ${
                    isCurrentPlayer
                      ? 'bg-amber-400/10 border-l-4 border-l-amber-400'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Left: Rank & Username */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 flex items-center justify-center shrink-0">
                      {rankBadge}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                        <span className="truncate">{entry.username}</span>
                        {isCurrentPlayer && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(entry.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {entry.catches > 0 && ` • ${entry.catches} catches`}
                      </div>
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-right pl-3 shrink-0">
                    <div className="font-fun font-black text-sm sm:text-base text-amber-300">
                      {entry.score.toLocaleString()}
                    </div>
                    {entry.max_combo > 0 && (
                      <div className="text-[10px] text-orange-400 font-semibold flex items-center justify-end gap-0.5">
                        <Flame className="w-2.5 h-2.5 fill-orange-400" />
                        {entry.max_combo}x
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Back
          </button>

          <button
            onClick={() => {
              onClose();
              onPlayClick();
            }}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-fun font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-transform"
          >
            PLAY NOW 🏃💨
          </button>
        </div>
      </div>
    </div>
  );
};
