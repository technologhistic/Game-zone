import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Flame, Clock, Trophy, Target, Pause, Play, RotateCcw, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { FloatingText } from '../types/game';
import { sound } from '../lib/sound';
import { fireMiniBurst } from '../lib/confetti';

interface GameScreenProps {
  username: string;
  bestScore: number;
  isMuted: boolean;
  onToggleSound: () => void;
  onGameOver: (results: {
    score: number;
    duration: number;
    catches: number;
    misses: number;
    maxCombo: number;
    difficulty: number;
    sessionId: string;
  }) => void;
  onAbandon: () => void;
}

const TOTAL_GAME_TIME = 30; // 30 seconds

const CATCH_ROASTS = [
  'YOU GOT ME! 😳',
  'That was lucky 😂',
  'Ouch! 🤕',
  'Bro had aimbot?! 🤖',
  'How did you do that?! ⚡',
  'NOOOOO! 😭',
  'Okay, that was fast! 🔥',
];

const MISS_ROASTS = [
  'HAHA! Too slow 😂',
  'Almost got me!',
  'NOPE! 😭',
  'Try again! 😜',
  'Bro missed 💀',
  'I’m faster than you! 💨',
  'You okay bro? 🤨',
  'Your finger needs training 😂',
  'The button is bullying you 😈',
  'At this point, the button owns you 😂',
  'Click the screen, not the air! 👻',
];

const DIFFICULTY_TITLES = [
  'Level 1: Sleepy Button 😴',
  'Level 2: Waking Up 🥱',
  'Level 3: Jumpy 🦘',
  'Level 4: Slippery Soap 🧼',
  'Level 5: Caffeinated ☕',
  'Level 6: Turbocharged 🚀',
  'Level 7: Teleporting 🌀',
  'Level 8: Sonic Speed 🦔',
  'Level 9: The Flash ⚡',
  'Level 10: Matrix God 🕶️',
];

export const GameScreen: React.FC<GameScreenProps> = ({
  username,
  bestScore,
  isMuted,
  onToggleSound,
  onGameOver,
  onAbandon,
}) => {
  // Game session unique ID
  const sessionIdRef = useRef<string>(
    crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Math.random().toString(36).substring(2, 9)
  );

  // Core stats
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_GAME_TIME);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [catches, setCatches] = useState<number>(0);
  const [misses, setMisses] = useState<number>(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string>('Catch the Game Zone button! 😜');
  const [statusColor, setStatusColor] = useState<string>('text-amber-300');
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState<boolean>(false);

  // Button state
  const [btnPos, setBtnPos] = useState({ x: 50, y: 50 }); // in percentages
  const [btnText, setBtnText] = useState('GAME ZONE! 🎮');
  const [btnScale, setBtnScale] = useState(1);
  const [isFakeButton, setIsFakeButton] = useState(false);

  // References
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const lastDodgeTimeRef = useRef<number>(0);
  const lastCatchTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const floatingIdRef = useRef<number>(1);

  // Button dimension calculation based on difficulty (shrinks safely from 140px to min 88px)
  const buttonWidth = Math.max(88, 140 - (difficulty - 1) * 5);
  const buttonHeight = Math.max(46, 58 - (difficulty - 1) * 1.5);

  // Difficulty title
  const currentDiffTitle = DIFFICULTY_TITLES[Math.min(difficulty - 1, DIFFICULTY_TITLES.length - 1)];

  /**
   * Spawn button safely within game area
   */
  const relocateButton = useCallback(
    (reason: 'catch' | 'dodge' | 'initial' = 'catch') => {
      if (!gameAreaRef.current) return;
      const bounds = gameAreaRef.current.getBoundingClientRect();
      const padding = 16;

      const availWidth = bounds.width - buttonWidth - padding * 2;
      const availHeight = bounds.height - buttonHeight - padding * 2;

      if (availWidth <= 0 || availHeight <= 0) return;

      const randomX = padding + Math.random() * availWidth;
      const randomY = padding + Math.random() * availHeight;

      const xPercent = (randomX / bounds.width) * 100;
      const yPercent = (randomY / bounds.height) * 100;

      setBtnPos({ x: xPercent, y: yPercent });

      // Determine button label
      if (reason === 'catch') {
        const isFake = Math.random() < 0.22 && difficulty >= 3;
        setIsFakeButton(isFake);
        if (isFake) {
          setBtnText('THIS ONE IS EASY 😇');
        } else {
          const texts = ['GAME ZONE! 🎮', 'TRY ME! 🏃', 'TOO FAST! 💨', 'OVER HERE! 👈', 'NO WAY! 😜'];
          setBtnText(texts[Math.floor(Math.random() * texts.length)]);
        }
      }
    },
    [buttonWidth, buttonHeight, difficulty]
  );

  /**
   * Add floating popup animation
   */
  const addFloatingText = (x: number, y: number, text: string, type: 'score' | 'roast' | 'combo' | 'bonus' = 'score') => {
    const id = floatingIdRef.current++;
    setFloatingTexts((prev) => [...prev, { id, x, y, text, type }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 850);
  };

  /**
   * Successful catch event handler
   */
  const handleCatch = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // prevent miss trigger on area
    if (isPaused || timeLeft <= 0) return;

    const now = Date.now();
    const timeSinceLastCatch = now - lastCatchTimeRef.current;
    lastCatchTimeRef.current = now;

    // Fast catch reflex bonus (< 800ms)
    const isSuperFast = timeSinceLastCatch < 800;
    const speedBonus = isSuperFast ? 5 : 0;

    // Score calculation: base 10 + combo * 2 + speed bonus
    const nextCombo = combo + 1;
    const comboBonus = (nextCombo - 1) * 3;
    const pointsGained = 10 + comboBonus + speedBonus;

    const newScore = score + pointsGained;
    setScore(newScore);
    setCombo(nextCombo);
    if (nextCombo > maxCombo) {
      setMaxCombo(nextCombo);
    }
    setCatches((prev) => prev + 1);
    setConsecutiveMisses(0);

    // Increase difficulty every 3 catches
    const newDiff = Math.min(10, Math.floor((catches + 1) / 3) + 1);
    setDifficulty(newDiff);

    // Audio & particles
    sound.playCatch(nextCombo);

    // Click coordinates for effects
    let clientX = 0;
    let clientY = 0;
    if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    if (gameAreaRef.current) {
      const bounds = gameAreaRef.current.getBoundingClientRect();
      const relX = clientX - bounds.left;
      const relY = clientY - bounds.top;

      // Confetti burst
      fireMiniBurst(clientX / window.innerWidth, clientY / window.innerHeight);

      // Score popup
      let popupMsg = `+${pointsGained}`;
      if (isSuperFast) popupMsg += ' ⚡FAST';
      if (nextCombo >= 3) popupMsg += ` 🔥x${nextCombo}`;
      addFloatingText(relX, relY, popupMsg, 'score');
    }

    // Roast message
    const roast = CATCH_ROASTS[Math.floor(Math.random() * CATCH_ROASTS.length)];
    setStatusMessage(roast);
    setStatusColor('text-emerald-400 font-bold');

    // Squish button briefly, then relocate
    setBtnScale(0.8);
    setTimeout(() => {
      setBtnScale(1);
      relocateButton('catch');
    }, 90);
  };

  /**
   * Miss event handler (clicked in empty game area)
   */
  const handleAreaMiss = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPaused || timeLeft <= 0) return;

    sound.playMiss();
    setMisses((prev) => prev + 1);
    setCombo(0); // Combo breaks on miss!

    const newConsecutive = consecutiveMisses + 1;
    setConsecutiveMisses(newConsecutive);

    // Distance calculation for near-miss check
    if (gameAreaRef.current) {
      const bounds = gameAreaRef.current.getBoundingClientRect();
      const clickX = e.clientX - bounds.left;
      const clickY = e.clientY - bounds.top;

      // Button center
      const btnActualX = (btnPos.x / 100) * bounds.width + buttonWidth / 2;
      const btnActualY = (btnPos.y / 100) * bounds.height + buttonHeight / 2;

      const dist = Math.hypot(clickX - btnActualX, clickY - btnActualY);

      if (dist < 80) {
        setStatusMessage('SO CLOSE 😭');
        setStatusColor('text-amber-400 font-bold');
        addFloatingText(clickX, clickY, 'SO CLOSE! 😭', 'bonus');
        // Near miss dodges away!
        dodgeButton();
      } else {
        // High consecutive misses roast
        if (newConsecutive >= 4) {
          const rageRoasts = [
            'You okay bro? 😂',
            'Your finger needs training 💅',
            'The button is bullying you 😈',
            'At this point, the button owns you 💀',
          ];
          setStatusMessage(rageRoasts[Math.floor(Math.random() * rageRoasts.length)]);
        } else {
          const roast = MISS_ROASTS[Math.floor(Math.random() * MISS_ROASTS.length)];
          setStatusMessage(roast);
        }
        setStatusColor('text-rose-400 font-medium');
        addFloatingText(clickX, clickY, 'MISS! 💀', 'roast');
      }
    }
  };

  /**
   * Dodge button away when pointer gets close (Proximity evasion)
   */
  const dodgeButton = useCallback(() => {
    const now = Date.now();
    // Cooldown prevents infinite instantaneous bouncing, making game fair & playable!
    // Cooldown decreases slightly with higher difficulty (from 240ms down to 140ms)
    const cooldown = Math.max(140, 240 - difficulty * 10);
    if (now - lastDodgeTimeRef.current < cooldown) return;

    lastDodgeTimeRef.current = now;
    sound.playDodge();
    relocateButton('dodge');

    if (Math.random() < 0.25) {
      const dodgeTaunts = ['NOPE! 💨', 'TOO SLOW! 🏃', 'ALMOST! 😜', 'CAN’T TOUCH THIS! 🕺'];
      setStatusMessage(dodgeTaunts[Math.floor(Math.random() * dodgeTaunts.length)]);
      setStatusColor('text-amber-300');
    }
  }, [difficulty, relocateButton]);

  /**
   * Pointer proximity check inside game area
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPaused || timeLeft <= 0 || !gameAreaRef.current) return;

    const bounds = gameAreaRef.current.getBoundingClientRect();
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;

    const btnCenterX = (btnPos.x / 100) * bounds.width + buttonWidth / 2;
    const btnCenterY = (btnPos.y / 100) * bounds.height + buttonHeight / 2;

    const dist = Math.hypot(mouseX - btnCenterX, mouseY - btnCenterY);

    // Evasion trigger threshold: scales slightly with difficulty (50px to 80px)
    const triggerRadius = 45 + difficulty * 3.5;

    // Fake button occasionally lures you in by not dodging immediately, then darts away!
    if (isFakeButton && dist < 30) {
      dodgeButton();
    } else if (!isFakeButton && dist < triggerRadius) {
      dodgeButton();
    }
  };

  /**
   * Initial spawn
   */
  useEffect(() => {
    relocateButton('initial');
  }, [relocateButton]);

  /**
   * Game 30s Countdown timer
   */
  useEffect(() => {
    if (isPaused) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current as NodeJS.Timeout);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isPaused]);

  /**
   * Handle game over when timer reaches 0
   */
  useEffect(() => {
    if (timeLeft === 0) {
      sound.playGameOver(score > bestScore);
      onGameOver({
        score,
        duration: TOTAL_GAME_TIME,
        catches,
        misses,
        maxCombo,
        difficulty,
        sessionId: sessionIdRef.current,
      });
    }
  }, [timeLeft, score, bestScore, catches, misses, maxCombo, difficulty, onGameOver]);

  const progressPercent = (timeLeft / TOTAL_GAME_TIME) * 100;
  const isTimeCritical = timeLeft <= 7;

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 flex flex-col flex-1 select-none">
      {/* HUD Header */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          {/* Player & Difficulty */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold text-sm">
              🎮
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 truncate max-w-[110px] sm:max-w-[160px]">
                {username}
              </div>
              <div className="text-[11px] font-semibold text-amber-400/90">
                {currentDiffTitle}
              </div>
            </div>
          </div>

          {/* Current Score & High Score */}
          <div className="text-center px-2">
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              Score
            </div>
            <div className="font-fun text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none drop-shadow">
              {score}
            </div>
          </div>

          {/* Combo Meter */}
          <div className="flex items-center gap-2">
            <div
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                combo >= 3
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-md shadow-orange-500/20 scale-105'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <Flame
                className={`w-4 h-4 ${
                  combo >= 3 ? 'fill-orange-400 text-orange-400 animate-bounce' : 'text-slate-500'
                }`}
              />
              <span className="font-fun font-bold text-xs sm:text-sm">
                {combo > 0 ? `${combo}x` : '0x'}
              </span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Pause / Abandon Button */}
            <button
              onClick={() => {
                setIsPaused(true);
                setShowAbandonConfirm(true);
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-rose-400 transition-colors"
              title="Pause / Give up"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              Time Remaining
            </span>
            <span
              className={`font-fun font-bold text-sm ${
                isTimeCritical ? 'text-rose-400 animate-pulse' : 'text-slate-200'
              }`}
            >
              {timeLeft}s
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isTimeCritical
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                  : 'bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Live Funny Status / Roast Bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <div className={`truncate max-w-[75%] font-medium ${statusColor}`}>
            {statusMessage}
          </div>
          <div className="text-slate-400 text-[11px] shrink-0">
            Catches: <span className="text-slate-200 font-bold">{catches}</span> | Misses:{' '}
            <span className="text-rose-400 font-bold">{misses}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Game Arena */}
      <div
        ref={gameAreaRef}
        onClick={handleAreaMiss}
        onMouseMove={handleMouseMove}
        className="relative flex-1 min-h-[380px] sm:min-h-[460px] w-full rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800/80 overflow-hidden cursor-crosshair shadow-inner"
        style={{ touchAction: 'none' }}
      >
        {/* Playful background watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <span className="font-fun text-9xl font-extrabold text-white">😂</span>
        </div>

        {/* Corner boundaries guide */}
        <div className="absolute top-3 left-3 text-[10px] font-bold text-slate-700 uppercase tracking-widest pointer-events-none">
          Catch Zone
        </div>

        {/* Floating popups */}
        {floatingTexts.map((item) => (
          <div
            key={item.id}
            style={{ left: item.x, top: item.y }}
            className={`absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 font-fun font-extrabold text-sm sm:text-base z-30 animate-score-popup whitespace-nowrap ${
              item.type === 'score'
                ? 'text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]'
                : item.type === 'bonus'
                ? 'text-cyan-300 drop-shadow-[0_2px_8px_rgba(6,182,212,0.5)]'
                : 'text-rose-400 drop-shadow-[0_2px_8px_rgba(244,63,94,0.5)]'
            }`}
          >
            {item.text}
          </div>
        ))}

        {/* THE EVASIVE TARGET BUTTON */}
        <button
          type="button"
          onClick={handleCatch}
          onTouchStart={(e) => {
            // Mobile tap directly on button
            handleCatch(e);
          }}
          onMouseEnter={dodgeButton}
          style={{
            position: 'absolute',
            left: `${btnPos.x}%`,
            top: `${btnPos.y}%`,
            width: `${buttonWidth}px`,
            height: `${buttonHeight}px`,
            transform: `scale(${btnScale}) translate(-50%, -50%)`,
            transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 20,
          }}
          className={`rounded-2xl font-fun font-extrabold text-xs sm:text-sm tracking-wide shadow-xl cursor-pointer select-none active:scale-90 flex items-center justify-center text-center px-2 border-2 ${
            isFakeButton
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 border-white text-slate-950 shadow-emerald-500/40 animate-pulse'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 border-amber-200 text-slate-950 shadow-amber-500/40'
          }`}
          aria-label="Game Zone Button"
        >
          <span className="leading-tight drop-shadow-sm">{btnText}</span>
        </button>
      </div>

      {/* Abandon / Pause Modal */}
      {showAbandonConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-fun text-xl font-bold text-white mb-1">Game Paused</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-5">
              The button is patiently waiting to mock you. Do you want to continue or give up?
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowAbandonConfirm(false);
                  setIsPaused(false);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-fun font-bold text-sm shadow-md active:scale-95"
              >
                RESUME CHASE
              </button>
              <button
                onClick={onAbandon}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 font-semibold text-xs transition-colors"
              >
                Give Up & Return to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
