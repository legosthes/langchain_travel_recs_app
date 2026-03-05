import "./style.css";
import "preline";

const INTERESTS = [
  { id: "good-food", label: "Good Food", icon: "🍜" },
  { id: "urban-vibes", label: "Urban Vibes", icon: "🏙️" },
  { id: "nature", label: "Nature", icon: "🌿" },
  { id: "off-beaten-path", label: "Off the Beaten Path", icon: "🗺️" },
  { id: "nightlife", label: "Nightlife", icon: "🌙" },
  { id: "history-culture", label: "History & Culture", icon: "🏛️" },
  { id: "freebies", label: "Free Things to Do", icon: "🆓" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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
    </label>`,
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
            <input type="number" id="days" name="days" min="1" max="7" placeholder="e.g. 5" required
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
    document.querySelectorAll('input[name="interests"]:checked'),
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

    itineraryContent.innerHTML = buildTimeline(data.itinerary);
    initAccordions();
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

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatContent(text) {
  const BADGE = {
    Morning: "bg-amber-100 text-amber-700",
    Afternoon: "bg-sky-100 text-sky-700",
    Evening: "bg-indigo-100 text-indigo-700",
  };

  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /^### (.*$)/gm,
      '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>',
    )
    .replace(
      /^-\s+(?:<strong>)?(Morning|Afternoon|Evening):?(?:<\/strong>)?:?\s*/gm,
      (_, period) => {
        const colors = BADGE[period];
        return `<li class="ml-4"><span class="inline-block px-2 py-0.5 rounded text-xs font-semibold ${colors} mr-1">${period}</span> `;
      },
    )
    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/(<li[\s\S]*<\/li>)/g, '<ul class="list-disc space-y-1">$1</ul>')
    .replace(/\n{2,}/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

function parseSections(text) {
  const safe = escapeHtml(text);
  const lines = safe.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    const h2Match = line.match(/^\*\*(.*?)\*\*\s*$/);
    if (h2Match) {
      if (current) sections.push(current);
      current = { title: h2Match[1].replace(/:$/, ""), body: "" };
    } else if (current) {
      current.body += line + "\n";
    } else {
      // Intro text before the first heading
      if (!sections.length && line.trim()) {
        sections.push({ title: null, body: line + "\n" });
      } else if (
        sections.length &&
        sections[sections.length - 1].title === null
      ) {
        sections[sections.length - 1].body += line + "\n";
      }
    }
  }
  if (current) sections.push(current);
  return sections;
}

const SECTION_ICONS = {
  "Best Time to Visit": "☀️",
  "Daily Itinerary": "📅",
  "Local Tips": "💡",
  "Recommended Restaurants": "🍽️",
  "Estimated Budget": "💰",
};

function getSectionIcon(title) {
  if (!title) return "📌";
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (title.includes(key)) return icon;
  }
  if (/^Day\s+\d+/i.test(title)) return "📍";
  return "📌";
}

function buildTimeline(text) {
  const sections = parseSections(text);
  if (!sections.length) return "<p>No itinerary generated.</p>";

  return sections
    .map((section, i) => {
      if (section.title === null) {
        return `<div class="mb-4 text-gray-600">${formatContent(section.body.trim())}</div>`;
      }

      // "Daily Itinerary" is the main title, not an accordion
      if (/daily itinerary/i.test(section.title)) {
        return `<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">${section.title}</h1>`;
      }

      const icon = getSectionIcon(section.title);
      const isLast = i === sections.length - 1;
      const id = `section-${i}`;

      return `
      <div class="relative pl-10 ${isLast ? "" : "pb-6"}">
        <!-- Timeline line -->
        ${isLast ? "" : '<div class="absolute left-3.75 top-8 bottom-0 w-0.5 bg-gray-200"></div>'}
        <!-- Timeline dot -->
        <div class="absolute left-0 top-1 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-sm ring-4 ring-white">
          ${icon}
        </div>
        <!-- Accordion -->
        <div class="border border-gray-200 rounded-xl overflow-hidden">
          <button type="button" data-accordion="${id}"
            class="accordion-toggle w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
            <span class="font-semibold text-gray-900">${section.title}</span>
            <svg class="accordion-arrow w-4 h-4 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <div id="${id}" class="accordion-body hidden">
            <div class="px-4 py-3 text-sm text-gray-700 leading-relaxed">
              ${formatContent(section.body.trim())}
            </div>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

function initAccordions() {
  document.querySelectorAll(".accordion-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-accordion");
      const body = document.getElementById(targetId);
      const arrow = btn.querySelector(".accordion-arrow");
      const isOpen = !body.classList.contains("hidden");

      if (isOpen) {
        body.classList.add("hidden");
        arrow.classList.remove("rotate-180");
      } else {
        body.classList.remove("hidden");
        arrow.classList.add("rotate-180");
      }
    });
  });

  // Open the first section by default
  const first = document.querySelector(".accordion-toggle");
  if (first) first.click();
}
