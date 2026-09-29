import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Trophy, Flame, Sparkles, MessageSquare, AlertCircle, Quote, Mic, Smile, RefreshCw } from 'lucide-react';
import { RoastMessage, HumorScore } from '../types/game';
import { sound } from '../lib/sound';
import { fireMiniBurst, fireConfetti } from '../lib/confetti';

interface RoastLoungeProps {
  username: string;
  onBackToGame: () => void;
  onOpenHumorLeaderboard: () => void;
}

const LOCAL_HUMOR_SCORES_KEY = 'catchme_real_humor_scores';
const LOCAL_BEST_HUMOR_KEY = 'catchme_user_best_humor';

const PROMPT_SUGGESTIONS = [
  'Tell me a pitch-black joke 💀',
  'Roast my life choices 😂',
  'Why don’t skeletons fight each other? 🦴',
  'Hit me with your darkest one-liner 😈',
  'Why did the chicken cross the road? (Make it dark)',
];

export const RoastLounge: React.FC<RoastLoungeProps> = ({
  username,
  onBackToGame,
  onOpenHumorLeaderboard,
}) => {
  const [messages, setMessages] = useState<RoastMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [bestHumorScore, setBestHumorScore] = useState<number>(0);
  const [bestHumorTitle, setBestHumorTitle] = useState<string>('Unrated Comic');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user best humor score
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_BEST_HUMOR_KEY}_${username.toLowerCase()}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBestHumorScore(parsed.score || 0);
        setBestHumorTitle(parsed.title || 'Unrated Comic');
      }
    } catch {}

    // Initial greeting from Roastmaster
    const welcomeMsg: RoastMessage = {
      id: 'welcome-msg',
      role: 'model',
      text: `Welcome to the stage, ${username}. 🎙️ I hope you brought thick skin, because in this comedy club, my jokes don't pull punches. Drop your best joke or comeback, and let's see if your humor score is worthy of the Leaderboard! 😈`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcomeMsg]);
  }, [username]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveHumorScoreToLeaderboard = async (score: number, title: string, punchline: string) => {
    try {
      // 1. Submit to server
      await fetch('/api/roast/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          score,
          title,
          bestPunchline: punchline,
        }),
      });
    } catch {
      // Server error fallback
    }

    // 2. Also save to local storage
    try {
      const raw = localStorage.getItem(LOCAL_HUMOR_SCORES_KEY);
      const list: HumorScore[] = raw ? JSON.parse(raw) : [];
      const existingIdx = list.findIndex((e) => e.username.toLowerCase() === username.toLowerCase());

      const newEntry: HumorScore = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'humor_' + Math.random().toString(36).substring(2, 9),
        username,
        score,
        title,
        bestPunchline: punchline.slice(0, 100),
        created_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        if (score > list[existingIdx].score) {
          list[existingIdx] = newEntry;
        }
      } else {
        list.push(newEntry);
      }

      list.sort((a, b) => b.score - a.score);
      localStorage.setItem(LOCAL_HUMOR_SCORES_KEY, JSON.stringify(list.slice(0, 50)));

      // Save user personal best
      localStorage.setItem(
        `${LOCAL_BEST_HUMOR_KEY}_${username.toLowerCase()}`,
        JSON.stringify({ score, title })
      );
    } catch {}
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    sound.playDodge();
    setInputValue('');

    const userMsg: RoastMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Format history
      const history = messages.map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/roast/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          messages: history,
          userMessage: text,
        }),
      });

      if (!res.ok) {
        throw new Error('Chat failed');
      }

      const data = await res.json();
      const humorScore = Number(data.humorScore) || 50;
      const humorTitle = data.humorTitle || 'Aspiring Comic';
      const critique = data.critique || 'Decent try.';
      const replyText = data.reply || "That was something... I guess!";

      const modelMsg: RoastMessage = {
        id: 'bot_' + Date.now(),
        role: 'model',
        text: replyText,
        humorScore,
        humorTitle,
        critique,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);

      // Sound feedback based on humor score
      if (humorScore >= 75) {
        sound.playCatch(3);
        fireMiniBurst(0.5, 0.4);
      } else if (humorScore < 40) {
        sound.playMiss();
      }

      // If user beat their personal best humor score, celebrate!
      if (humorScore > bestHumorScore) {
        setBestHumorScore(humorScore);
        setBestHumorTitle(humorTitle);
        saveHumorScoreToLeaderboard(humorScore, humorTitle, text);
        if (humorScore >= 70) {
          fireConfetti();
        }
      }
    } catch {
      // Fallback response if offline
      const fallbackMsg: RoastMessage = {
        id: 'bot_err_' + Date.now(),
        role: 'model',
        text: "The microphone feedback was so screeching I almost died. But honestly, my coffee table has more comedic timing than that. Try me again! 😂",
        humorScore: 45,
        humorTitle: 'Static Noise 📻',
        critique: 'Audio cut out before you could deliver the punchline.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      sound.playMiss();
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    if (score >= 60) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-2 flex flex-col h-[calc(100vh-80px)] min-h-[500px]">
      {/* Top Lounge Bar */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-2 shadow-xl backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBackToGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Back to Game Zone"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-fun text-sm sm:text-base font-extrabold text-white flex items-center gap-1">
                Roast Club <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">18+</span>
              </span>
              <span className="hidden sm:inline text-xs text-slate-400">• Stand-Up Lounge</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Stage Name: <strong className="text-amber-300">{username}</strong>
            </div>
          </div>
        </div>

        {/* Right: Live Humor Meter & Leaderboard Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User's Best Humor Score */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Best Humor:</span>
            <span className="font-fun font-bold text-amber-300">
              {bestHumorScore > 0 ? `${bestHumorScore}/100` : 'Unrated'}
            </span>
          </div>

          {/* Humor Leaderboard Button */}
          <button
            onClick={onOpenHumorLeaderboard}
            className="py-1.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xs:inline">Humor</span> Leaderboard
          </button>
        </div>
      </div>

      {/* Main Chat Thread */}
      <div className="flex-1 overflow-y-auto rounded-3xl bg-slate-900/50 border border-slate-800 p-3 sm:p-4 space-y-4 shadow-inner">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[92%] sm:max-w-[85%] ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              {/* Sender label */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                {isUser ? (
                  <>
                    <span>{username}</span>
                    <span>• {msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      <Mic className="w-3 h-3" /> The Roastmaster
                    </span>
                    <span>• {msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-amber-400 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* AI Humor Score Audit Card (attached to model reply for the user's joke) */}
              {!isUser && msg.humorScore !== undefined && (
                <div
                  className={`mt-2 w-full p-2.5 rounded-xl border text-[11px] space-y-1 ${getScoreColor(
                    msg.humorScore
                  )}`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Humor Rating: {msg.humorScore}/100
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-black bg-slate-950/60">
                      {msg.humorTitle}
                    </span>
                  </div>

                  {msg.critique && (
                    <p className="text-slate-300 italic pt-0.5 flex items-start gap-1">
                      <Quote className="w-3 h-3 shrink-0 inline opacity-70 mt-0.5" />
                      "{msg.critique}"
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-xs text-rose-300 w-fit animate-pulse">
            <Mic className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>The Roastmaster is sharpening a punchline... 🔥</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
        {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSendMessage(suggestion)}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 hover:border-amber-400/50 text-slate-300 hover:text-amber-300 text-[11px] whitespace-nowrap transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 shrink-0 pt-1"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            placeholder="Drop a joke, roast back, or challenge the comic..."
            className="w-full py-3 pl-4 pr-10 rounded-2xl bg-slate-900 border border-slate-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-100 placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none transition-all"
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="p-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold shadow-lg shadow-rose-600/25 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
