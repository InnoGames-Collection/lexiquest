/* Name That Picture — identify the object with the precise word. */
(function () {
  "use strict";
  const { el, shuffled } = LQ;

  LQ.register({
    id: "thing",
    title: "Name That Picture",
    icon: "🏺",
    tagline: "Can you put the right word to the picture? Choose wisely.",
    render: LQ.mcqQuiz({
      gameId: "thing",
      rounds: 10,
      choiceCols: 2,
      bank() { return shuffled(LQ_DATA.THING); },
      renderPrompt(item) {
        return el("div", null,
          el("div", { class: "emoji", text: item.emoji }),
          el("p", { class: "prompt", text: "What is this called?" })
        );
      },
      choicesFor(item) {
        return [{ label: item.a, correct: true }]
          .concat(item.wrong.map((w) => ({ label: w, correct: false })));
      },
      feedback(item, ok) {
        return ok ? "Correct!" : `That is a ${item.a}.`;
      },
      resultTitle(score, total) {
        if (score === total) return "🏆 Perfect eye!";
        if (score >= total * 0.7) return "🔍 Sharp-eyed!";
        return "🏺 Keep looking!";
      },
    }),
  });
})();
