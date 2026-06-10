# LexiQuest — Free Word Games

**By InnoSphere Technologies**

Ten free, fully playable word games inspired by the most popular puzzle formats
at Merriam-Webster Games (Quordle, Octordle, Blossom, The Missing Letter,
How Strong Is Your Vocabulary?, Name That Thing, Spell It, True or False,
Twofer Goofer–style rhyme riddles, and word-path puzzles). All names, art, and
question content are original.

## The games

| Game | Inspired by | How it plays |
|---|---|---|
| 🟩 Quad Grid | Quordle | Solve 4 five-letter words at once in 9 guesses |
| 🐙 Octo Grid | Octordle | 8 words at once in 13 guesses |
| 🌼 Petal Power | Blossom | Build 4+ letter words from 7 letters; center letter required; pangram bonus |
| 🔎 The Missing Letter | The Missing Letter | Fill each word's missing letter; together they spell a secret word |
| 💪 Vocabulary Strength | How Strong Is Your Vocabulary? | 10 definition MCQs with rising difficulty and a strength rank |
| 🏺 Name That Picture | Name That Thing | Match the picture to the precise word |
| 🐝 Spell Check | Spell It | Pick the one correct spelling among convincing traps |
| ⚖️ Fact or Fib | True or False | Judge word-meaning statements, with explanations |
| 🎶 Rhyme Twins | Twofer Goofer | Each riddle's answer is a rhyming word pair |
| 🏔️ Word Trek | Pilgrim / Boggle | Trace adjacent-letter paths in a 4×4 grid against the clock |

## Run it

No build, no dependencies — it's a static site:

```sh
cd lexiquest
python3 -m http.server 8741
# open http://localhost:8741
```

Opening `index.html` directly from the file system also works (plain scripts,
no modules).

## Deploy (Vercel)

The repo is a plain static site — Vercel needs **no build step**:

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework preset: **Other**. Leave *Build Command* empty and
   *Output Directory* empty (root). Deploy.

`vercel.json` already sets cache headers for the generated word data and
basic security headers. Every push to `main` redeploys automatically.

## Features

- Daily puzzles: seed rotates with the date, plus unlimited practice rounds
- Full physical-keyboard and on-screen-keyboard support
- Per-game stats (played / won / best / streak) persisted in `localStorage`
- Light & dark theme (follows system preference, toggle in header)
- Responsive layout, works on mobile widths
- Zero network calls, zero tracking, no account

## Architecture

```
index.html            app shell; script load order = hub order
css/style.css         shared design system (CSS variables, themes)
js/core.js            hash router, game registry, storage/stats, modal/toast,
                      shared on-screen keyboard
js/games/quiz-engine.js  reusable MCQ quiz runner
js/games/*.js         one self-registering IIFE per game (LQ.register)
js/data/words.js      generated: 8.5k valid guesses, 774 answers, 50k trek words
js/data/petals.js     generated: pre-computed petal puzzles
js/data/quizbank.js   hand-authored question banks
tools/generate_data.py  regenerates js/data from /usr/share/dict/words
test/smoke.html       headless interaction test page (drives every game)
```

## Tests

```sh
python3 -m http.server 8741 &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --virtual-time-budget=15000 \
  --dump-dom http://localhost:8741/test/smoke.html | grep -E 'PASS|FAIL|DONE'
```

16 interaction assertions cover every game (guess validation, duplicate
rejection, scoring, reveal/advance flows, path selection, storage).
