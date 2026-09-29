import React, { useState, useEffect } from 'react';
import { Trophy, X, RefreshCw, Flame, AlertCircle, Sparkles, Quote } from 'lucide-react';
import { HumorScore } from '../types/game';

interface HumorLeaderboardModalProps {
  currentUsername: string;
  onClose: () => void;
}

const LOCAL_HUMOR_SCORES_KEY = 'catchme_real_humor_scores';

export const HumorLeaderboardModal: React.FC<HumorLeaderboardModalProps> = ({
  currentUsername,
  onClose,
}) => {
  const [scores, setScores] = useState<HumorScore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHumorScores = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/roast/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.scores)) {
          setScores(data.scores);
          setLoading(false);
          return;
        }
      }
      throw new Error('Fallback to local');
    } catch {
      // Local fallback for offline / serverless
      try {
        const raw = localStorage.getItem(LOCAL_HUMOR_SCORES_KEY);
        const list: HumorScore[] = raw ? JSON.parse(raw) : [];
        list.sort((a, b) => b.score - a.score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setScores(list);
      } catch {
        setScores([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHumorScores();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-rose-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-fun text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                Humor Leaderboard 😈
              </h2>
              <p className="text-[11px] text-slate-400">
                Ranked by AI Roastmaster based on wit, punchlines & dark humor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHumorScores}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="my-4 flex-1 overflow-y-auto min-h-[260px] max-h-[380px] rounded-2xl bg-slate-950/60 border border-slate-800/80 divide-y divide-slate-800/50">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin text-rose-400" />
              <p className="text-xs font-medium">Scanning comedy club archives...</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="text-4xl">🎭</div>
              <h4 className="font-fun font-bold text-white text-base">No comedians on the board yet!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Step up to the mic, banter with the Roastmaster, and get your humor score rated!
              </p>
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

              if (rank === 1) rankBadge = <span className="text-base">🥇</span>;
              else if (rank === 2) rankBadge = <span className="text-base">🥈</span>;
              else if (rank === 3) rankBadge = <span className="text-base">🥉</span>;

              return (
                <div
                  key={entry.id || index}
                  className={`px-4 py-3 flex items-start justify-between gap-3 text-xs transition-colors ${
                    isCurrentPlayer
                      ? 'bg-rose-500/10 border-l-4 border-l-rose-500'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Left: Rank & User */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-6 pt-0.5 flex items-center justify-center shrink-0">
                      {rankBadge}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{entry.username}</span>
                        {isCurrentPlayer && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-500 text-white">
                            YOU
                          </span>
                        )}
                        <span className="text-[10px] text-amber-300 font-medium px-1.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                          {entry.title}
                        </span>
                      </div>

                      {entry.bestPunchline && (
                        <p className="text-[11px] text-slate-400 mt-1 italic flex items-center gap-1 line-clamp-1">
                          <Quote className="w-3 h-3 text-rose-400 shrink-0 inline" />
                          "{entry.bestPunchline}"
                        </p>
                      )}

                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(entry.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Humor Score */}
                  <div className="text-right shrink-0">
                    <div className="font-fun text-xl sm:text-2xl font-black bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent">
                      {entry.score}/100
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Humor Level
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
