link . https://gamefunzone.vercel.app/
# Catch Me 😂 — The Button That Refuses to Be Clicked

A funny, addictive, production-ready browser reflex game built with React, TypeScript, Tailwind CSS, and Supabase.

Players have 30 seconds to catch an elusive button with survival instincts that roasts you whenever you miss!

---

## 🎮 Game Concept & Features

- **Evasive Button Mechanics**: The button uses proximity evasion algorithms with fair dodge cooldowns (140ms–240ms) so skilled players can corner, predict, and catch it.
- **Progressive Difficulty**:
  - Starts as *Level 1: Sleepy Button 😴*
  - Progresses up to *Level 10: Matrix God 🕶️*
  - Button dynamically scales down from 140px to min safe 88px (strictly preserving touch targets > 44px on mobile phones).
- **Funny Roasts & Rage Messages**:
  - On miss: *"Bro missed 💀"*, *"HAHA! Too slow 😂"*, *"Your finger needs training 😂"*, *"The button owns you 💀"*
  - On near-miss (&lt; 80px): *"SO CLOSE 😭"*
  - On successful catch: *"YOU GOT ME! 😳"*, *"That was lucky 😂"*, *"Bro had aimbot?! 🤖"*
  - Fake button trick: *"THIS ONE IS EASY 😇"* (freezes briefly, then darts away!)
- **Combo System & Fast Reflex Bonuses**:
  - Consecutive catches build combo multipliers (+3 pts per combo).
  - Quick catches under 800ms award a +5 speed bonus.
  - Missing resets combo to zero.
- **Procedural Web Audio API Synthesizer**:
  - Zero external MP3/WAV file dependencies.
  - Catch arpeggios that scale in pitch with combo level.
  - Comical miss buzz, dodge whoosh, countdown beeps, and fanfare.
  - Sound ON/OFF toggle with persistent state in `localStorage`.
- **Achievements System**:
  - 8 distinct badges ("First Catch", "On Fire!", "Ultra Instinct", "Button Bully", "The Button Fears You", etc.).
- **Global & Daily Leaderboard**:
  - Live Supabase cloud integration with Row Level Security (RLS).
  - Instant offline fallback to local Hall of Fame when credentials are not yet set.
  - Daily vs All-Time filter, Top 10 vs Top 50 view.
  - Current player highlighted with rank and medals 🥇🥈🥉.
- **Anti-Cheat Protection**:
  - Unique cryptographic session IDs.
  - Rate limiting & duplicate session submission prevention.
  - Realistic human speed and score bounds enforcement (&lt;= 1200 points, &gt;= 15s duration).
  - Row Level Security (RLS) constraints on PostgreSQL.
- **Mobile Responsive Design**:
  - Fully responsive from 320px screens up to 4K displays.
  - `touch-action: none` on the arena to prevent accidental pulls or page scroll interruptions during gameplay.
  - Smooth 60fps animations with `@tailwindcss/vite` and `canvas-confetti`.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Audio**: Web Audio API (procedural synthesis, no audio assets needed)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Anonymous Auth)
- **Local Storage**: Offline persistence for profiles, streaks, high scores, and fallback leaderboards

---

## 🚀 Environment Variables

Copy `.env.example` to `.env`:

```env
# Supabase Configuration (Optional for cloud leaderboard; local offline fallback is active by default)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-public-key"
```

> **Security Note**: Never expose the `service_role` secret key in frontend code. Only the public `anon` key is used.

---

## 🗄️ Database Setup (Supabase)

1. Open your Supabase project dashboard.
2. Go to the **SQL Editor**.
3. Run the migration script in `supabase/migrations/20250101000000_init_catch_me.sql`.
4. Under **Authentication** > **Providers**, ensure **Anonymous Sign-In** is enabled.

---

## 📦 Development & Build

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run TypeScript check
npm run lint
```
