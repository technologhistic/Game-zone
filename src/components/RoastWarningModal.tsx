import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Check, X, User, ArrowRight } from 'lucide-react';
import { validateUsername } from '../lib/supabase';
import { sound } from '../lib/sound';

interface RoastWarningModalProps {
  currentUsername: string;
  onCancel: () => void;
  onConfirm: (confirmedUsername: string) => void;
}

export const RoastWarningModal: React.FC<RoastWarningModalProps> = ({
  currentUsername,
  onCancel,
  onConfirm,
}) => {
  const [usernameInput, setUsernameInput] = useState(currentUsername || '');
  const [agreedAge, setAgreedAge] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateUsername(usernameInput);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'A valid username is mandatory!');
      sound.playMiss();
      return;
    }

    if (!agreedAge) {
      setErrorMsg('You must verify that you are 18+ before proceeding.');
      sound.playMiss();
      return;
    }

    setErrorMsg(null);
    sound.playCatch(2);
    onConfirm(validation.cleanName);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl my-auto text-left relative overflow-hidden">
        {/* Glowing warning aura */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-extrabold text-[11px] tracking-wider uppercase mb-0.5">
              18+ Mature Humor Lounge
            </div>
            <h2 className="font-fun text-xl sm:text-2xl font-black text-white">
              Mature Content Warning
            </h2>
          </div>
        </div>

        {/* Advisory details */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 mb-5 text-xs text-slate-300 leading-relaxed">
          <p className="font-bold text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            Contains Dark Humor, Sarcasm & Savage Roasts
          </p>
          <p className="text-slate-400">
            You are entering the Underground Comedy Club. The AI Roastmaster will deliver unfiltered dark comedy, cynical jokes, and savage roasts. The AI will also judge and rank your humor level on the public Humor Leaderboard.
          </p>
          <p className="text-[11px] text-slate-500 italic">
            * Strictly no hate speech, sexually explicit pornography, or real-world harm. Comedy club roast battle style only.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mandatory Username */}
          <div>
            <label
              htmlFor="roast-username"
              className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5 text-slate-200">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Stage Name (Compulsory)
              </span>
              <span className="text-[10px] text-rose-400 font-bold">*Required</span>
            </label>

            <input
              id="roast-username"
              type="text"
              maxLength={20}
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Your comedy stage name"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              autoComplete="off"
            />
          </div>

          {/* Age & Consent Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
            <div className="relative flex items-center pt-0.5">
              <input
                type="checkbox"
                checked={agreedAge}
                onChange={(e) => {
                  setAgreedAge(e.target.checked);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-4 h-4 rounded text-rose-500 border-slate-700 bg-slate-900 focus:ring-rose-500 focus:ring-offset-slate-900 cursor-pointer"
              />
            </div>
            <span className="text-xs text-slate-300 font-medium leading-snug">
              I certify that <strong className="text-white">I am 18 years of age or older</strong> and consent to dark humor and comedic roasts.
            </span>
          </label>

          {/* Error Message */}
          {errorMsg && (
            <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-fun text-base font-extrabold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <span>ENTER 18+ ROAST LOUNGE 😈</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Go Back (Stay Kid-Friendly)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
