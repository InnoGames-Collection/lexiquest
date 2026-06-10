/* Vocabulary Strength — how strong is your vocabulary? Difficulty ramps up. */
(function () {
  "use strict";
  const { el, shuffled } = LQ;

  const RANKS = [
    [0, "Word Watcher"], [4, "Phrase Finder"], [6, "Lexicon Climber"],
    [8, "Vocabulary Heavyweight"], [10, "Word Wizard"],
  ];

  function rankFor(score) {
    let r = RANKS[0][1];
    for (const [min, name] of RANKS) if (score >= min) r = name;
    return r;
  }

  LQ.register({
    id: "vocab",
    title: "Vocabulary Strength",
    icon: "💪",
    tagline: "Ten definitions, rising difficulty. How strong is your vocabulary?",
    render: LQ.mcqQuiz({
      gameId: "vocab",
      rounds: 10,
      bank() {
        // two questions from each difficulty tier, easy first
        const out = [];
        for (let d = 1; d <= 5; d++) {
          out.push(...shuffled(LQ_DATA.VOCAB.filter((x) => x.d === d)).slice(0, 2));
        }
        return out;
      },
      renderPrompt(item) {
        return el("div", null,
          el("p", { class: "prompt", text: `What does “${item.q}” mean?` }),
          el("p", { class: "sub", text: "Difficulty " + "★".repeat(item.d) + "☆".repeat(5 - item.d) })
        );
      },
      choicesFor(item) {
        return [{ label: item.a, correct: true }]
          .concat(item.wrong.map((w) => ({ label: w, correct: false })));
      },
      feedback(item, ok) {
        return ok ? "Correct!" : `“${item.q}” means: ${item.a}.`;
      },
      resultTitle(score) {
        return `💪 ${rankFor(score)}`;
      },
      resultBody(score, total) {
        const pct = Math.round((score / total) * 100);
        return `You got <b>${score} of ${total}</b> (${pct}%).<br><br>
          <div class="meter"><div class="fill" style="width:${pct}%"></div></div>
          Rank: <b>${rankFor(score)}</b>`;
      },
    }),
  });
})();
