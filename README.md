# Opening Trainer

A chess opening repertoire trainer: pull real lines from the Lichess database,
learn them with tip arrows and auto-play, then drill them with spaced
repetition. Installs to your phone's home screen as a PWA.

## What it does

- **Add an opening** from a preset list (Italian, Najdorf, London, etc.)
- **New Lines** — the app queries the [Lichess Opening Explorer](https://lichess.org/opening)
  and builds a pruned tree of the most-played continuations. Lines are numbered
  and color-coded by branch. Tap a line to step through it with arrow tips and
  auto-played moves, then tick it off as learned.
- **Learn** — spaced-repetition drilling (Leitner system) over the lines
  you've learned. The app auto-plays your opponent's book moves and waits for
  you to play your side, either by dragging or tapping-then-tapping a piece.
  Wrong moves get an arrow hint. Settings let you hide the current line
  number or pick which lines are in the practice pool.

## Tech stack

- Vite + React + TypeScript
- `chess.js` for move legality, `react-chessboard` for the board/arrows/drag
- Lichess Opening Explorer API (public, no key needed) — called live from the
  browser, not baked in at build time
- `localStorage` for your repertoire, progress, and settings — nothing is
  sent to a server, there's no backend
- `vite-plugin-pwa` for the installable home-screen app

## Honest limitations, read before you rely on this

- **The Lichess Opening Explorer is a free third-party service.** It's
  generally reliable but has had outages and rate-limit periods (most
  recently a multi-day outage in Feb 2026 after infrastructure problems on
  Lichess's end). If "Generate lines" fails, it's almost always their API,
  not this app — wait a bit and retry. There's nothing I can do to guarantee
  their uptime.
- Line generation needs an internet connection (it's calling a live API from
  your phone's browser). Once lines are generated they're cached in
  `localStorage`, so you don't need to regenerate every time you open the
  app — only when you want fresher data (use "Refresh lines from Lichess").
- The tree-building is intentionally pruned (max ~24 lines per opening, moves
  need at least ~8% share to count as a branch) so it stays fast and doesn't
  hammer the free API. It won't show you obscure 0.1%-of-games sidelines —
  that's a deliberate tradeoff, not a bug.
- This is a personal, single-device tool: progress lives in your phone's
  browser storage. It won't sync across devices, and clearing your browser
  data / reinstalling will lose your progress. If you want sync later, that's
  a real feature to add (would need a backend), not something built in now.
- Board piece style is the `react-chessboard` default set, not a pixel-exact
  match to the screenshot you sent — the square colors are matched, the
  pieces are the library's built-in ones.

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Deploying to Vercel (so it's on your phone's home screen)

### 1. Push the code to GitHub

```bash
cd chess-trainer
git init
git add .
git commit -m "Opening trainer"
```

Create a new empty repo on [github.com/new](https://github.com/new) (don't
initialize it with a README), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

### 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in (GitHub login
   is easiest).
2. Click **Import** next to the repo you just pushed.
3. Vercel auto-detects this as a **Vite** project — you shouldn't need to
   change the build command (`npm run build`) or output directory (`dist`).
   Leave everything default.
4. Click **Deploy**. It takes about a minute.

You'll get a URL like `https://your-repo-name.vercel.app`. That's it — no
environment variables, no backend, no database to configure. It's a fully
static site that talks to Lichess directly from the browser.

### 3. Add it to your home screen

**iPhone (Safari):**
1. Open your Vercel URL in Safari (must be Safari, not Chrome, for this to
   work on iOS).
2. Tap the Share icon (square with an arrow) in the bottom bar.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. The icon and name you set in the manifest will show up.

**Android (Chrome):**
1. Open your Vercel URL in Chrome.
2. Tap the three-dot menu.
3. Tap **Add to Home screen** (or you may get an automatic "Install app"
   banner/prompt — either works).
4. Confirm.

Either way, it opens full-screen with no browser chrome, like a native app.

### 4. Making changes later

Any time you want to change something: edit the code, commit, and
`git push`. Vercel automatically redeploys on every push to `main` — no
manual redeploy step.

## Project structure

```
src/
  types.ts                 # shared TypeScript types
  lib/
    openingPresets.ts       # the preset opening list on the Add screen
    explorer.ts              # Lichess API calls + line-tree builder
    srs.ts                    # Leitner spaced-repetition scheduler
    storage.ts                 # localStorage persistence
    moveFormat.ts               # SAN formatting helpers
  components/
    Board.tsx                # chessboard: drag, tap-to-move, arrows
    OpeningsHome.tsx          # home page: opening list + add sheet
    OpeningDetail.tsx          # the "2 paths" menu (New Lines / Learn)
    NewLinesView.tsx            # line checklist + demo line viewer
    PracticeView.tsx             # SRS drilling mode
  App.tsx                    # top-level state + routing
```

## Verified before handoff

- `npx tsc --noEmit` — 0 errors
- `npx oxlint` — 0 warnings, 0 errors
- `npm run build` — production build succeeds, PWA manifest + service worker
  generate correctly
- `vite preview` — built output serves and loads correctly
