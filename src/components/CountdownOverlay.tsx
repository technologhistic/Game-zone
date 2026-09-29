import React, { useEffect, useState } from 'react';
import { sound } from '../lib/sound';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number>(3);
  const [text, setText] = useState<string>('3');

  useEffect(() => {
    sound.playCountdownTick(3);

    const timer1 = setTimeout(() => {
      setCount(2);
      setText('2');
      sound.playCountdownTick(2);
    }, 800);

    const timer2 = setTimeout(() => {
      setCount(1);
      setText('1');
      sound.playCountdownTick(1);
    }, 1600);

    const timer3 = setTimeout(() => {
      setCount(0);
      setText('GO! 🏃💨');
      sound.playCountdownGo();
    }, 2400);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center select-none animate-fadeIn">
      <div className="text-center px-4">
        <p className="text-sm sm:text-base font-bold text-amber-400 tracking-widest uppercase mb-3">
          Get Ready To Tap!
        </p>

        <div
          key={text}
          className={`font-fun font-extrabold text-7xl sm:text-9xl tracking-tight transition-all duration-300 transform scale-110 ${
            count === 0
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400 scale-125'
              : count === 1
              ? 'text-rose-400'
              : count === 2
              ? 'text-amber-400'
              : 'text-amber-300'
          }`}
        >
          {text}
        </div>

        <p className="mt-4 text-xs sm:text-sm text-slate-400 font-medium">
          Do not blink. The button does not play nice. 😂
        </p>
      </div>
    </div>
  );
};
