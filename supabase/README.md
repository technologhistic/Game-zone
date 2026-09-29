# Supabase Backend Setup for Catch Me 😂

This game integrates with Supabase for user profiles, anonymous authentication, and a real-time global leaderboard with Row Level Security (RLS) and anti-cheat constraints.

## Quick Setup Steps

1. **Create a Supabase Project**
   - Go to [https://supabase.com](https://supabase.com) and create a new project.

2. **Run the Database Migration**
   - In your Supabase Dashboard, open the **SQL Editor**.
   - Copy the contents of `/supabase/migrations/20250101000000_init_catch_me.sql` and click **Run**.
   - This creates the `profiles` and `game_scores` tables, indexes, and RLS policies.

3. **Enable Anonymous Sign-In (Recommended)**
   - Go to **Authentication** > **Providers** > **Anonymous**.
   - Toggle **Enable Anonymous Sign-In** to ON and click **Save**.
   - This allows players to hop straight into the game and submit scores with an authenticated session without filling in email/password passwords.

4. **Add Environment Variables**
   - Go to **Project Settings** > **API**.
   - Copy your Project URL and `anon` `public` key.
   - Set them in your `.env.local` or environment settings:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

> ⚠️ **Security Notice**: Never expose your `service_role` secret key in frontend code. Only use the public `anon` key.

## Fallback & Offline Resilience

If Supabase is not configured or goes offline:
- The game automatically falls back to local storage!
- High scores, achievements, streaks, and local leaderboard entries are seamlessly tracked in the browser.
- When Supabase credentials are provided, cloud syncing activates immediately.
