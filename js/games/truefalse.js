/* Fact or Fib — true/false statements about word meanings. */
(function () {
  "use strict";
  const { el, shuffled } = LQ;

  LQ.register({
    id: "tf",
    title: "Fact or Fib",
    icon: "⚖️",
    tagline: "True or false? Trust your inner lexicographer.",
    render: LQ.mcqQuiz({
      gameId: "tf",
      rounds: 12,
      choiceCols: 2,
      bank() { return shuffled(LQ_DATA.TF); },
      renderPrompt(item) {
        return el("p", { class: "prompt", text: item.s });
      },
      choicesFor(item) {
        return [
          { label: "True", correct: item.t },
          { label: "False", correct: !item.t },
        ];
      },
      feedback(item, ok) {
        return (ok ? "Correct! " : "Not quite. ") + item.why;
      },
      resultTitle(score, total) {
        if (score === total) return "⚖️ Flawless judgment!";
        if (score >= total * 0.7) return "✅ Strong instincts!";
        return "🤔 The dictionary awaits!";
      },
    }),
  });
})();
