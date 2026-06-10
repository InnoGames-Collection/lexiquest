# LexiQuest — Free Word, Number, Math & Logic Games

**By InnoSphere Technologies**

23 free, fully playable browser games across four categories. Installable as a
PWA, fully playable offline, no account, no ads, zero runtime dependencies.

## The games

**🔤 Word** — Quad Grid (4 simultaneous word guesses), Octo Grid (8 boards),
Petal Power (7-letter flower, pangram bonus), The Missing Letter (secret-word
gimmick), Vocabulary Strength, Name That Picture, Spell Check, Fact or Fib,
Rhyme Twins, Word Trek (timed letter-path grid).

**🔢 Numerical** — Equation Grid (guess the hidden equation), Number Sequence
(find the rule), Make 24 (combine four numbers, built-in solver), Digit Sprint
(60-second mental math with streak bonuses).

**🧮 Mathematical** — Mini Sudoku (6×6, uniqueness-checked generator, two
difficulties), Nine Sums (place 1-9 to match row/column sums), Fraction Duel,
Prime Hunter (timed prime spotting with strikes).

**🧠 Analytical** — Code Breaker (Mastermind-style deduction), Memory Matrix
(growing flash-recall grids), Odd One Out, Pattern Next (generated symbol
sequences), Logic Riddles.

## Platform features

- **Four-category hub** with per-game stats (played / won / best / streak)
- **XP and levels** earned across all games, persisted locally
- **Daily seeds**: puzzle rotation tied to the date, plus unlimited practice
- **Shareable results** (emoji grids) via Web Share API with clipboard fallback
- **Sound effects** (WebAudio synth, no assets) with mute toggle
- **PWA**: installable, offline-first service worker, themed icons
- **Mobile-first**: responsive layouts, touch keyboards via hidden-input
  catcher, safe-area insets, 16px inputs (no iOS zoom), `touch-action` tuning
- **Accessibility**: aria labels/roles, focus-visible outlines, keyboard
  navigation on the hub and grids, `prefers-reduced-motion` support
- **Light/dark theme** following system preference

## Run it

```sh
npm start            # python3 http.server on :8741
# or just open index.html — plain scripts, no build step
```

## Quality gates

```sh
npm run check        # node --check every JS file
npm run lint         # eslint (flat config, no-undef/eqeqeq/no-var/...)
# browser smoke tests (~45 assertions across all 23 games):
npm start &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --virtual-time-budget=30000 \
  --dump-dom http://localhost:8741/test/smoke.html | grep -E 'PASS|FAIL|DONE'
```

CI (`.github/workflows/ci.yml`) runs all three gates on every push and PR.

## Architecture

```
index.html              app shell; script order = hub order
manifest.json, sw.js    PWA install + offline cache (bump CACHE on release)
css/style.css           design system: CSS variables, themes, responsive clamps
js/core.js              router, registry, storage/stats/XP, modal/toast/share,
                        sound synth, keyboards, typeCatcher (mobile input)
js/games/quiz-engine.js reusable MCQ runner (5 games build on it)
js/games/*.js           one self-registering IIFE per game (LQ.register)
js/data/words.js        generated: 8.5k guesses, 774 answers, 50k trek words
js/data/petals.js       generated petal puzzles
js/data/quizbank.js     authored word-quiz banks
js/data/brainbank.js    authored logic/odd-one-out banks
tools/generate_data.py  regenerates js/data from /usr/share/dict/words
test/smoke.html         headless interaction tests for every game
```

## Deploy (Vercel)

Static site, no build step: import the repo, framework preset **Other**, leave
build command and output directory empty. `vercel.json` sets cache and security
headers; `.vercelignore` keeps tests/tooling out of production. Every push to
`main` redeploys.

When releasing, bump the `CACHE` version in `sw.js` so installed PWAs pick up
the new assets.
