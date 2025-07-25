const bikes = [];
let currentQuestion = 0;
const answers = {};

document.getElementById("openQuiz").onclick = () => {
  document.getElementById("quizModal").classList.remove("hidden");
  loadQuestion();
};

document.getElementById("closeQuiz").onclick = () => {
  document.getElementById("quizModal").classList.add("hidden");
  currentQuestion = 0;
  answers = {};
};

const quizContainer = document.getElementById("quizContainer");

const questions = [
  { key: "use_case", text: "What will you mainly use the bike for?", options: ["commuting", "trail", "leisure"] },
  { key: "terrain", text: "What kind of terrain will you ride on?", options: ["flat", "hilly", "mixed"] },
  { key: "support", text: "How much motor support do you want?", options: ["low-support", "mid-support", "high-support"] },
  { key: "range", text: "How far do you typically ride on a single trip?", options: ["short-distance", "medium-distance", "long-distance"] },
  { key: "budget", text: "What’s your budget?", options: ["budget", "mid-range", "premium"] }
];

function loadQuestion() {
  if (currentQuestion >= questions.length) {
    showResults();
    return;
  }

  const q = questions[currentQuestion];
  quizContainer.innerHTML = `
    <div class="mb-4">
      <h2 class="text-xl font-semibold mb-2">${q.text}</h2>
      <div class="space-y-2">
        ${q.options.map(opt => `<button class="answerBtn bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded" data-key="${q.key}" data-value="${opt}">${opt}</button>`).join("")}
      </div>
    </div>
  `;

  document.querySelectorAll(".answerBtn").forEach(btn => {
    btn.onclick = () => {
      answers[btn.dataset.key] = btn.dataset.value;
      currentQuestion++;
      loadQuestion();
    };
  });
}

function showResults() {
  fetch("bikes.json")
    .then(res => res.json())
    .then(data => {
      const scored = data.map(bike => {
        let score = 0;
        let mismatches = [];

        if (bike.tags.includes(answers.use_case)) score++; else mismatches.push("use case");
        if (bike.tags.includes(answers.terrain)) score++; else mismatches.push("terrain");
        if (bike.tags.includes(answers.support)) score++; else mismatches.push("support level");
        if (bike.tags.includes(answers.range)) score++; else mismatches.push("range");
        if (bike.tags.includes(answers.budget)) score++; else mismatches.push("budget");

        return { ...bike, score, mismatches };
      });

      const topMatches = scored
        .filter(b => b.score >= 4)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      quizContainer.innerHTML = `
        <h2 class="text-xl font-semibold mb-4">Your Bike Matches</h2>
        <div class="space-y-4">
          ${topMatches.length ? topMatches.map(bike => `
            <div class="border p-4 rounded shadow">
              <h3 class="font-bold">${bike.name}</h3>
              <p class="text-sm text-gray-600">Matched ${bike.score}/5 criteria</p>
              ${bike.mismatches.length ? `<p class="text-xs text-red-500">Not a perfect match on: ${bike.mismatches.join(", ")}</p>` : ""}
            </div>
          `).join("") : `<p>No perfect matches found, but we’ll be adding more bikes soon!</p>`}
        </div>
      `;
    });
}
