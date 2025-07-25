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
  Object.keys(answers).forEach(k => delete answers[k]);
};

const quizContainer = document.getElementById("quizContainer");

const questions = [
  { key: "use_case", text: "How will you mainly use your e-bike?", options: ["commuting", "trail", "leisure", "hybrid"] },
  { key: "terrain", text: "What kind of terrain will you ride on?", options: ["flat", "hilly", "mixed"] },
  { key: "range", text: "How far do you need it to go on a single charge?", options: ["short", "medium", "long"] },
  { key: "equipped", text: "Do you want your bike to be fully equipped (racks, lights etc)?", options: ["yes", "no", "unsure"] },
  { key: "budget", text: "What’s your maximum budget?", options: ["\u00a31,000", "\u00a31,500", "\u00a32,000", "\u00a33,000+"] }
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
      const budgetMap = {
        "£1,000": 1000,
        "£1,500": 1500,
        "£2,000": 2000,
        "£3,000+": 100000
      };

      const userBudget = budgetMap[answers.budget];

      const scored = data.map(bike => {
        let score = 0;
        let mismatches = [];

        if (bike.use_case === answers.use_case) score++; else mismatches.push("use case");
        if (bike.terrain === answers.terrain) score++; else mismatches.push("terrain");
        if (bike.range === answers.range) score++; else mismatches.push("range");
        if (bike.equipped === answers.equipped) score++; else mismatches.push("equipment");

        const bikePrice = parseFloat(bike.price.replace(" GBP", "").replace(",", ""));
        if (!isNaN(bikePrice) && bikePrice <= userBudget) score++; else mismatches.push("budget");

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
              <a href="${bike.product_url}" class="text-blue-600 underline text-sm" target="_blank">View Bike</a>
            </div>
          `).join("") : `<p>No perfect matches found, but we’ll be adding more bikes soon!</p>`}
        </div>
      `;
    });
}
