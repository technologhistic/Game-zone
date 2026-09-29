import confetti from 'canvas-confetti';

export function fireConfetti() {
  if (typeof window === 'undefined') return;

  // Multi-burst colorful confetti
  const count = 120;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899'],
  });
  fire(0.2, {
    spread: 60,
    colors: ['#facc15', '#a855f7', '#06b6d4'],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

export function fireMiniBurst(xPercent: number, yPercent: number) {
  if (typeof window === 'undefined') return;
  confetti({
    particleCount: 18,
    spread: 45,
    startVelocity: 22,
    origin: { x: xPercent, y: yPercent },
    colors: ['#f59e0b', '#f43f5e', '#10b981', '#38bdf8'],
    scalar: 0.7,
    ticks: 40,
    zIndex: 100,
  });
}
