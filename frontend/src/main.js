import "./style.css";
import "preline";

const INTERESTS = [
  { id: "good-food", label: "Good Food", icon: "🍜" },
  { id: "urban-vibes", label: "Urban Vibes", icon: "🏙️" },
  { id: "nature", label: "Nature", icon: "🌿" },
  { id: "off-beaten-path", label: "Off the Beaten Path", icon: "🗺️" },
  { id: "nightlife", label: "Nightlife", icon: "🌙" },
  { id: "history-culture", label: "History & Culture", icon: "🏛️" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function renderInterestChips() {
  return INTERESTS.map(
    (interest) => `
    <label class="cursor-pointer">
      <input type="checkbox" name="interests" value="${interest.label}" class="hidden peer" />
      <span class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 border-gray-200
        bg-white text-sm font-medium text-gray-700
        peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700
        hover:border-gray-300 transition-all select-none">
        <span>${interest.icon}</span>
        ${interest.label}
      </span>
    </label>`
  ).join("");
}

function renderMonthOptions() {
  return MONTHS.map((m) => `<option value="${m}">${m}</option>`).join("");
}

document.querySelector("#app").innerHTML = `
  <div class="max-w-2xl mx-auto px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-10">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">AI Travel Agent</h1>
      <p class="text-gray-500 text-lg">Get a personalized travel itinerary in seconds</p>
    </div>

    <!-- Form Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <form id="travel-form" class="space-y-6">
        <!-- Destination -->
        <div>
          <label for="city" class="block text-sm font-medium text-gray-700 mb-1.5">Destination</label>
          <input type="text" id="city" name="city" placeholder="e.g. Tokyo, Paris, Buenos Aires" required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
        </div>

        <!-- Days + Month row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="days" class="block text-sm font-medium text-gray-700 mb-1.5">Days</label>
            <input type="number" id="days" name="days" min="1" max="30" placeholder="e.g. 5" required
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
          </div>
          <div>
            <label for="month" class="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
            <select id="month" name="month" required
              class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
              <option value="">Select month</option>
              ${renderMonthOptions()}
            </select>
          </div>
        </div>

        <!-- Interests -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Interests</label>
          <div class="flex flex-wrap gap-2">
            ${renderInterestChips()}
          </div>
        </div>

        <!-- Submit -->
        <button type="submit" id="submit-btn"
          class="w-full py-3.5 px-6 rounded-xl bg-blue-600 text-white font-semibold text-base
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          Generate Itinerary
        </button>
      </form>
    </div>

    <!-- Error -->
    <div id="error" class="hidden mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"></div>

    <!-- Result -->
    <div id="result" class="hidden mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Your Itinerary</h2>
      <div id="itinerary-content" class="prose prose-sm max-w-none text-gray-700 leading-relaxed"></div>
    </div>
  </div>
`;

// Form submission
const form = document.getElementById("travel-form");
const submitBtn = document.getElementById("submit-btn");
const resultDiv = document.getElementById("result");
const errorDiv = document.getElementById("error");
const itineraryContent = document.getElementById("itinerary-content");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const city = document.getElementById("city").value.trim();
  const days = document.getElementById("days").value;
  const month = document.getElementById("month").value;
  const interests = Array.from(
    document.querySelectorAll('input[name="interests"]:checked')
  ).map((cb) => cb.value);

  if (interests.length === 0) {
    errorDiv.textContent = "Please select at least one interest.";
    errorDiv.classList.remove("hidden");
    resultDiv.classList.add("hidden");
    return;
  }

  errorDiv.classList.add("hidden");
  resultDiv.classList.add("hidden");
  submitBtn.disabled = true;
  submitBtn.textContent = "Generating...";

  try {
    const res = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, days, month, interests }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    itineraryContent.innerHTML = formatMarkdown(data.itinerary);
    resultDiv.classList.remove("hidden");
    resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Generate Itinerary";
  }
});

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/(<li.*<\/li>)/s, '<ul class="list-disc space-y-1">$1</ul>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, "<br/>");
}
