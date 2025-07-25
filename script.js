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
        ${q.options.map(opt => `<button class="answerBtn bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded transition" data-key="${q.key}" data-value="${opt}">${opt}</button>`).join("")}
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
  quizContainer.innerHTML = `<div class='text-center py-10'><span class='text-lg font-medium'>Finding your perfect bike...</span><div class='mt-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto'></div></div>`;

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

        const cleanedPrice = typeof bike.price === "string" ? bike.price.replace(/[\u00a3,]/g, "").replace(" GBP", "").trim() : "0";
        const bikePrice = parseFloat(cleanedPrice);
        if (!isNaN(bikePrice) && bikePrice <= userBudget) score++; else mismatches.push("budget");

        return { ...bike, score, mismatches };
      });

      const topMatches = scored
        .filter(b => b.available === "in stock")
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      quizContainer.innerHTML = `
        <h2 class="text-xl font-semibold mb-4">Your Bike Matches</h2>
        <div class="space-y-4">
          ${topMatches.length ? topMatches.map(bike => `
            <div class="border p-4 rounded shadow flex gap-4 items-start hover:shadow-md transition">
             ${bike.image_url ? `<img src="${bike.image_url.replace(/([^:]\/)\/+/g, "$1")}" alt="${bike.name}" class="w-24 h-24 object-cover rounded">` : ""}
              <div>
                <h3 class="font-bold text-lg">${bike.name}</h3>
                ${bike.price ? `<p class="text-sm text-gray-800 font-medium">${bike.price}</p>` : ""}
                <p class="text-sm text-gray-600">Matched ${bike.score}/5 criteria</p>
                ${bike.mismatches.length ? `<p class="text-xs text-red-500">Not a perfect match on: ${bike.mismatches.join(", ")}</p>` : ""}
                <a href="${bike.product_url}" class="text-blue-600 underline text-sm" target="_blank">View Bike</a>
              </div>
            </div>
          `).join("") : `<p>No matches found based on your selections. Try adjusting your answers or check back soon for more bikes!</p>`}
        </div>
        <div class="mt-6 text-center">
          <button id="restartQuiz" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Start Over</button>
        </div>
      `;

      document.getElementById("restartQuiz").onclick = () => {
        currentQuestion = 0;
        Object.keys(answers).forEach(k => delete answers[k]);
        loadQuestion();
      };
    })
    .catch(err => {
      console.error("Failed to fetch or process bikes.json:", err);
      quizContainer.innerHTML = `<p class='text-red-600'>Sorry, something went wrong loading the results. Please try again later.</p>`;
    });
}
