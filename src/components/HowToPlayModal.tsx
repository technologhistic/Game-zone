import React from 'react';
import { HelpCircle, X, Target, Flame, AlertCircle, Zap, ShieldAlert } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
  onPlayClick: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose, onPlayClick }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[88vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-fun text-xl sm:text-2xl font-extrabold text-white">
                How to Play 📖
              </h2>
              <p className="text-[11px] text-slate-400">Game Zone Rules & Tips</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1 text-xs sm:text-sm text-slate-300">
          {/* Rule 1 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="font-fun font-bold text-amber-300 text-sm">
                1. Catch The Button!
              </div>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Click or tap the button to score points. The button has survival instincts and will
                try to dart away as soon as your finger or cursor gets too close!
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
            <div className="p-2 rounded-xl bg-orange-400/10 text-orange-400 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="font-fun font-bold text-orange-300 text-sm">
                2. Build Your Combo
              </div>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Catching buttons consecutively ramps up your Combo Multiplier (+3 pts per combo
                tier). Missing a click resets your combo back to zero and incurs an insulting roast!
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
            <div className="p-2 rounded-xl bg-rose-400/10 text-rose-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-fun font-bold text-rose-300 text-sm">
                3. Beware of Fake-outs!
              </div>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Occasionally the button lies: <span className="text-emerald-300 font-semibold">“THIS ONE IS EASY 😇”</span>.
                It will freeze to lure you in, then dodge at supersonic speeds!
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
            <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-fun font-bold text-cyan-300 text-sm">
                4. Pro Tips For High Scores
              </div>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                • Corner the button against the edge so it has fewer escape routes.<br />
                • Fast catches (&lt; 0.8s) award an extra +5 Speed Bonus.<br />
                • On phones, use your dominant index finger or two thumbs!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Got It
          </button>
          <button
            onClick={() => {
              onClose();
              onPlayClick();
            }}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-fun font-bold text-xs sm:text-sm active:scale-95 shadow-md"
          >
            LET ME PLAY! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
