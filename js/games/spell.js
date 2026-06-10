/* Spell Check — pick the correct spelling of commonly misspelled words. */
(function () {
  "use strict";
  const { el, shuffled } = LQ;

  LQ.register({
    id: "spell",
    title: "Spell Check",
    icon: "🐝",
    tagline: "One of these spellings is right. The rest are traps.",
    render: LQ.mcqQuiz({
      gameId: "spell",
      rounds: 10,
      choiceCols: 2,
      bank() { return shuffled(LQ_DATA.SPELL); },
      renderPrompt(item) {
        return el("div", null,
          el("p", { class: "prompt", text: "Which spelling is correct?" }),
          el("p", { class: "sub", text: "“" + item.def + "”" })
        );
      },
      choicesFor(item) {
        return [{ label: item.a, correct: true }]
          .concat(item.wrong.map((w) => ({ label: w.trim(), correct: false })));
      },
      feedback(item, ok) {
        return ok ? "Correct!" : `The correct spelling is “${item.a}”.`;
      },
      resultTitle(score, total) {
        if (score === total) return "🐝 Spelling Bee Champion!";
        if (score >= total * 0.7) return "📝 Solid speller!";
        return "📖 Time to hit the dictionary!";
      },
    }),
  });
})();
