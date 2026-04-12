# Streak Challenge — Deployment Guide

A fully client-side quiz site with a Google Sheets-powered leaderboard.
Zero backend. Completely free.

---

## Stack

| Layer | Tool | Cost |
|---|---|---|
| Framework | React + Vite + Tailwind | Free |
| Hosting | Vercel | Free |
| Leaderboard data | Google Sheets (CSV export) | Free |
| Questions | `src/data/questions.json` in repo | Free |

---

## 1. Prerequisites

- Node.js 18+ installed locally
- A GitHub account
- A Vercel account (sign up at vercel.com — use your GitHub login)

---

## 2. Local setup

```bash
# Clone or download this repo, then:
cd streak-challenge
npm install

# Copy the env template
cp .env.example .env.local
# → Fill in .env.local (see Section 4 below)

npm run dev
# → http://localhost:5173
```

---

## 3. Set up the Google Sheet (leaderboard)

### 3-a. Create the sheet

1. Go to https://sheets.new
2. Rename it to something like **Streak Challenge Results**
3. In **row 1**, type these exact headers across columns A–D:

   | A | B | C | D |
   |---|---|---|---|
   | Name | Attempt | Streak | Time (M:SS) |

4. Leave rows 2+ empty for now — you'll fill them in as results come in.

### 3-b. Share the sheet publicly (read-only)

1. Click **Share** (top right)
2. Under "General access" → change to **Anyone with the link**
3. Set role to **Viewer**
4. Click **Done**

### 3-c. Get the CSV export URL

1. **File → Share → Publish to web**
2. In the first dropdown choose **Sheet1**
3. In the second dropdown choose **Comma-separated values (.csv)**
4. Click **Publish** → confirm
5. Copy the URL — it looks like:
   ```
   https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXX/pub?gid=0&single=true&output=csv
   ```
6. Paste this URL as `VITE_SHEET_CSV_URL` in your `.env.local` (and later in Vercel).

> ⚠️ Use the **Publish to web** CSV URL, NOT the regular sharing link.
> The published CSV URL is publicly readable without a Google login, which
> is what the site uses to fetch the data.

### 3-d. How to add results

When a participant sends you their screenshot:

1. Open the Google Sheet
2. Add one row per attempt:

   | Name | Attempt | Streak | Time (M:SS) |
   |---|---|---|---|
   | Alice | 1 | 12 | 2:34 |
   | Alice | 2 | 7 | 1:10 |
   | Bob | 1 | 15 | 4:02 |

   - **Name** — display name (must be consistent across all their attempts)
   - **Attempt** — 1, 2, or 3
   - **Streak** — the number shown on their result screen
   - **Time (M:SS)** — the time shown on their result screen (e.g. `2:34`)

3. Save the sheet. The leaderboard on the site refreshes automatically every 60 seconds.

---

## 4. Environment variables

Create `.env.local` (local) and add the same variables in Vercel (see Section 6).

```env
# Google Sheets CSV export URL (from Step 3-c)
VITE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/pub?gid=0&single=true&output=csv

# Admin page password — visit /admin and enter this to unlock the admin panel
VITE_ADMIN_PASSWORD=your-secret-password

# Challenge open window (ISO 8601 with timezone offset)
VITE_CHALLENGE_START=2025-04-20T00:00:00+09:00
VITE_CHALLENGE_END=2025-05-11T23:59:59+09:00
```

> **Timezone note:** `+09:00` is JST. Adjust if needed.
> The start/end dates control when the Start button appears and when the quiz is accessible.

---

## 5. Add your questions (April 19)

When you receive the 146-question bank, replace `src/data/questions.json`.

### Required format

```json
[
  {
    "id": "q001",
    "category": "advanced",
    "question": "Your question text here?",
    "choices": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": 1
  }
]
```

### Field reference

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique. e.g. `"q001"`, `"q002"` … |
| `category` | string | Must be one of: `"advanced"` `"pro"` `"trivia"` `"basic"` |
| `question` | string | The question text |
| `choices` | array of 4 strings | Exactly 4 answer options |
| `answer` | number | 0-based index of the correct choice (0 = A, 1 = B, 2 = C, 3 = D) |

### Minimum category requirements (enforced automatically)

Each quiz session picks exactly 15 questions:
- At least **3 advanced**
- At least **1 pro**
- At least **1 trivia**
- Remaining 10: random from anything in the bank

The bank must contain at least 3 advanced, 1 pro, and 1 trivia question or the picker falls back to pure random.

---

## 6. Deploy to Vercel

### 6-a. Push to GitHub

```bash
# In the streak-challenge folder:
git init
git add .
git commit -m "initial commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/streak-challenge.git
git branch -M main
git push -u origin main
```

### 6-b. Connect to Vercel

1. Go to https://vercel.com → **Add New Project**
2. Import your GitHub repo
3. Framework preset will be detected as **Vite** automatically
4. Click **Environment Variables** and add all four variables from Section 4
5. Click **Deploy**

Vercel will build and give you a live URL (e.g. `streak-challenge.vercel.app`).

### 6-c. Custom domain (optional)

In Vercel → Project → Settings → Domains → add your own domain.

### 6-d. Redeployment

Any `git push` to `main` triggers an automatic redeploy. This is how you ship the real questions on April 19 — just update `questions.json` and push.

---

## 7. File structure

```
streak-challenge/
├── index.html                    ← HTML entry point
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example                  ← copy to .env.local
├── .gitignore
│
└── src/
    ├── main.jsx                  ← Router + app entry
    ├── index.css                 ← Tailwind + component styles
    │
    ├── data/
    │   └── questions.json        ← ⭐ Replace with 146 Qs on Apr 19
    │
    ├── utils/
    │   ├── ranking.js            ← Tiebreak logic + CSV parser
    │   └── questionPicker.js     ← Category-aware random picker
    │
    ├── hooks/
    │   └── useCountdown.js       ← Live countdown timer
    │
    ├── components/
    │   └── Layout.jsx            ← Nav bar + page shell
    │
    └── pages/
        ├── Home.jsx              ← Landing page + countdown
        ├── Quiz.jsx              ← Full quiz engine
        ├── Result.jsx            ← Screenshot-optimised result screen
        ├── Leaderboard.jsx       ← Public leaderboard (reads from Sheet)
        └── Admin.jsx             ← Password-protected admin guide
```

---

## 8. Pages reference

| URL | Purpose | Access |
|---|---|---|
| `/` | Home — countdown, rules, Start button | Public |
| `/quiz` | The quiz itself | Public (only works during open window) |
| `/result` | Result screen after each attempt | Public |
| `/leaderboard` | Live rankings | Public |
| `/admin` | Instructions + env status | Password required |

---

## 9. Ranking / tiebreak logic

Applied automatically by the leaderboard:

1. **Best streak** — higher is better
2. **2nd-best streak** — if 1st is tied
3. **3rd-best streak** — if 2nd is tied
4. **Time of best attempt** — faster is better (if all 3 streaks equal)
5. **Time of 2nd attempt** — if step 4 is also tied

---

## 10. Pre-launch checklist

- [ ] `questions.json` replaced with real 146-question bank
- [ ] `VITE_SHEET_CSV_URL` set (Publish-to-web CSV, not the share link)
- [ ] `VITE_ADMIN_PASSWORD` set to something only you know
- [ ] `VITE_CHALLENGE_START` and `VITE_CHALLENGE_END` set correctly
- [ ] Google Sheet shared publicly (Viewer) AND published to web (CSV)
- [ ] Test locally with `npm run dev` — attempt the quiz end-to-end
- [ ] Deploy to Vercel and test on the live URL
- [ ] Visit `/admin` on the live site and verify all env vars show ✓ set
- [ ] Add a test row to the Sheet and confirm it appears on `/leaderboard` within 60 s

---

## 11. Troubleshooting

**Leaderboard shows "Could not load"**
→ Make sure you used the *Publish to web → CSV* URL, not the browser URL of the sheet.
→ The sheet must be published (File → Share → Publish to web) AND shared (Anyone with link, Viewer).

**Quiz opens even before April 20**
→ Check that `VITE_CHALLENGE_START` is set and the date is in the future. In `.env.local` changes require restarting `npm run dev`.

**Questions are always the same**
→ This is expected on a small bank. With 146 questions the random selection will vary significantly every attempt.

**Admin page won't unlock**
→ Make sure `VITE_ADMIN_PASSWORD` is set in your env AND you've redeployed since adding it. Env variables are baked in at build time.
