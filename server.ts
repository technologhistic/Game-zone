import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Google GenAI on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory store for real humor scores submitted during this server lifetime
export interface HumorScoreEntry {
  id: string;
  username: string;
  score: number; // 0 - 100
  title: string;
  bestPunchline: string;
  created_at: string;
}

const realHumorLeaderboard: HumorScoreEntry[] = [];

// System instruction for the 18+ Comedy Club Roastmaster
const ROASTMASTER_SYSTEM_INSTRUCTION = `You are "The Roastmaster", the headliner of an exclusive underground 18+ Dark Comedy Club.
Your job is to provide witty, razor-sharp, hilarious dark humor, cynical jokes, and savage roasts. You banter with the guest (the user) like a seasoned stand-up comic.

GUIDELINES:
1. HUMOR STYLE: Dark comedy, cynical observational humor, self-deprecating wit, savage roasts, and unexpected punchlines.
2. SAFETY BOUNDARIES (STRICT):
   - DO NOT generate explicit pornography, graphic sexual depictions, or non-consensual sexual content.
   - DO NOT generate hate speech against protected classes or actionable harm.
   - Keep the content firmly in the realm of edgy stand-up comedy, dark satire, and comedy club roast battles.
3. HUMOR JUDGMENT:
   - Carefully analyze the user's latest response for wit, originality, comedic timing, sarcasm, and shock value.
   - Assign a Humor Score from 0 to 100:
     - 0-35: Cringe, generic, unoriginal, or missed the joke completely.
     - 36-60: Mild chuckle, predictable dad joke, or decent attempt.
     - 61-80: Solid wit, sharp comeback, genuinely funny.
     - 81-100: God-tier savage punchline, pitch-black perfection, comedy club legend.
   - Give them a punchy comedic title (e.g., "Certified Savage 😈", "Cringe Overlord 🪦", "Dark Humor Prodigy 💀", "Dry Sarcasm Royalty 🍸", "Lukewarm Dad Joke 🥱", "Accidental Comedian 🎭").
   - Give a 1-sentence hilarious critique of their joke or comeback.`;

// API: AI Chat with Roastmaster + Humor Judging
app.post('/api/roast/chat', async (req: Request, res: Response) => {
  try {
    const { username, messages, userMessage } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const cleanUsername = (username || 'Anonymous').trim();

    // Format chat history for Gemini
    const contents: any[] = [];
    if (Array.isArray(messages)) {
      for (const m of messages.slice(-10)) {
        contents.push({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        });
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [
        {
          text: `[User "${cleanUsername}" says]: "${userMessage.trim()}". Respond with your comedy routine / roast, and evaluate my humor score!`,
        },
      ],
    });

    // Call Gemini API with structured JSON output
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: ROASTMASTER_SYSTEM_INSTRUCTION,
        temperature: 0.95,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Your funny, dark, or savage comedic response, joke, or roast.',
            },
            humorScore: {
              type: Type.INTEGER,
              description: 'The user humor score from 0 to 100 based on their latest message.',
            },
            humorTitle: {
              type: Type.STRING,
              description: 'A funny title classifying their humor tier.',
            },
            critique: {
              type: Type.STRING,
              description: 'A 1-sentence funny critique of their comeback or joke.',
            },
          },
          required: ['reply', 'humorScore', 'humorTitle', 'critique'],
        },
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        reply: text,
        humorScore: 50,
        humorTitle: 'Mysterious Comedian 🎭',
        critique: 'You broke the comedy analyzer with that one.',
      };
    }

    // Ensure score bounds
    parsed.humorScore = Math.max(0, Math.min(100, Number(parsed.humorScore) || 50));

    res.json({
      success: true,
      reply: parsed.reply,
      humorScore: parsed.humorScore,
      humorTitle: parsed.humorTitle || 'Aspiring Comic',
      critique: parsed.critique || 'Interesting delivery.',
    });
  } catch (error: any) {
    console.error('Roast chat error:', error);
    res.status(200).json({
      success: true,
      reply:
        "My microphone almost caught fire processing that punchline. Give me another one, let's see if you can top that! 😂",
      humorScore: 50,
      humorTitle: 'Unfiltered Rebel 🎙️',
      critique: 'Raw energy, needs a tighter punchline delivery.',
    });
  }
});

// API: Get Humor Leaderboard (Real users only)
app.get('/api/roast/leaderboard', (_req: Request, res: Response) => {
  // Sort by score desc, then date desc
  const sorted = [...realHumorLeaderboard].sort(
    (a, b) => b.score - a.score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({ success: true, scores: sorted.slice(0, 50) });
});

// API: Submit Humor Score (Real users only)
app.post('/api/roast/leaderboard', (req: Request, res: Response) => {
  const { username, score, title, bestPunchline } = req.body;

  if (!username || typeof score !== 'number') {
    res.status(400).json({ error: 'Username and score are required' });
    return;
  }

  const cleanName = username.trim();
  const validScore = Math.max(0, Math.min(100, Math.round(score)));

  // Check if user already has an entry; update if new score is higher
  const existingIndex = realHumorLeaderboard.findIndex(
    (e) => e.username.toLowerCase() === cleanName.toLowerCase()
  );

  const entry: HumorScoreEntry = {
    id: crypto.randomUUID ? crypto.randomUUID() : 'humor_' + Math.random().toString(36).substring(2, 9),
    username: cleanName,
    score: validScore,
    title: title || 'Underground Comic',
    bestPunchline: (bestPunchline || '').slice(0, 100),
    created_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    if (validScore > realHumorLeaderboard[existingIndex].score) {
      realHumorLeaderboard[existingIndex] = entry;
    }
  } else {
    realHumorLeaderboard.push(entry);
  }

  res.json({ success: true, entry });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
