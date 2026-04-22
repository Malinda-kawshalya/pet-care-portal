const env = require("../config/env");

const DAILY_CHAT_LIMIT = 50;

const SCOPE_HINTS = [
  "pet",
  "dog",
  "cat",
  "rabbit",
  "bird",
  "adoption",
  "shelter",
  "vaccine",
  "vaccines",
  "vaccination",
  "booster",
  "deworm",
  "deworming",
  "rabies",
  "dhpp",
  "feline",
  "distemper",
  "parvo",
  "parvovirus",
  "leptospirosis",
  "heartworm",
  "spay",
  "neuter",
  "nutrition",
  "feeding",
  "groom",
  "behavior",
  "behaviour",
  "training",
  "disease",
  "symptom",
  "vomit",
  "diarrhea",
  "itching",
  "skin",
  "wound",
  "vet",
  "health",
  "care",
  "food",
  "diet",
  "feed",
  "nutrition",
  "toxic",
  "poison",
  "puppy",
  "kitten",
  "rescue",
  "lost",
  "found",
  "qr",
  "clinic",
  "appointment",
  "vet visit",
  "emergency",
];

function isInScope(message = "") {
  const text = message.toLowerCase();
  return SCOPE_HINTS.some((hint) => text.includes(hint));
}

function mapHistoryToGeminiContents(history = []) {
  return history.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function buildImageParts(images = []) {
  return images.map((image) => ({
    inline_data: {
      mime_type: image.mimeType,
      data: image.dataBase64,
    },
  }));
}

function generateFallbackAssistantReply(userMessage = "") {
  const text = userMessage.toLowerCase();

  if (!isInScope(userMessage)) {
    return "I can help only with pet-related topics such as adoption, vaccinations, feeding, behavior, and routine health care.";
  }

  if (text.includes("vaccine") || text.includes("vaccination") || text.includes("booster")) {
    return [
      "For vaccines, follow a vet-approved schedule by age and species.",
      "Typical puppy/kitten plans start in early weeks with repeat boosters every 3-4 weeks until around 16 weeks.",
      "Rabies timing depends on local regulation, then periodic boosters.",
      "Bring your pet's previous vaccine card to avoid duplicate doses.",
      "If your pet is lethargic, has facial swelling, breathing trouble, or persistent vomiting after a shot, seek urgent vet care.",
    ].join(" ");
  }

  if (text.includes("vomit") || text.includes("diarrhea") || text.includes("not eating") || text.includes("emergency")) {
    return [
      "For possible urgent symptoms, monitor hydration, appetite, energy, and stool/vomit frequency closely.",
      "Same-day vet visit is advised for repeated vomiting/diarrhea, blood, severe lethargy, pain, or symptoms in puppies/kittens.",
      "If breathing is difficult, collapse occurs, or there are seizures, go to emergency veterinary care immediately.",
    ].join(" ");
  }

  if (text.includes("food") || text.includes("diet") || text.includes("feeding")) {
    return [
      "Use species- and life-stage-appropriate pet food and avoid sudden diet changes.",
      "Transition to new food gradually over about a week.",
      "Avoid toxic items like chocolate, grapes/raisins, xylitol, onions, and alcohol.",
      "If you share your pet age, species, and weight, I can suggest a safer feeding structure.",
    ].join(" ");
  }

  return [
    "I can help with adoption, vaccines, routine checkups, nutrition, behavior, and symptom guidance.",
    "Share your pet species, age, weight, and current issue, and I will give practical next steps.",
  ].join(" ");
}

async function generateAssistantReply({ userMessage, images = [], history = [], userContext = {} }) {
  if (!env.GEMINI_API_KEY) {
    return {
      reply: generateFallbackAssistantReply(userMessage),
      outOfScope: false,
    };
  }

  if (!isInScope(userMessage)) {
    return {
      reply:
        "I can help with pet adoption and pet care topics only. Please ask about pets, adoption workflow, care plans, health reminders, behavior, or related guidance.",
      outOfScope: true,
    };
  }

  const systemPolicy = [
    "You are PetAI Assistant for a pet adoption and care platform.",
    "Stay in scope: pet adoption, pet care, training, food and nutrition, routine and urgent symptom triage guidance, shelter process help, and app feature guidance.",
    "Core pet health focus: vaccination schedules, booster reminders, deworming basics, preventive care, diet transitions, behavior support, and common symptom triage.",
    "When discussing vaccines, give practical age-based and species-aware guidance, but tell users to confirm final schedules with a licensed vet and local regulation.",
    "If the user shares pet images, inspect visible signs and provide likely possibilities, home-care precautions, and clear vet-escalation advice.",
    "For disease or symptom questions, do not provide a definitive diagnosis. Give likely causes and suggest when urgent veterinary care is needed.",
    "Always include red-flag escalation cues when symptoms may be serious (breathing issues, collapse, seizures, uncontrolled bleeding, persistent vomiting/diarrhea, inability to urinate).",
    "For food questions, include safe/unsafe food guidance and portion caution by pet type.",
    "If asked for out-of-scope topics, politely refuse and redirect to pet-related help.",
    "Do not provide dangerous instructions.",
    "Keep responses concise and practical.",
    `User role: ${userContext.role || "unknown"}`,
    `User name: ${userContext.fullName || "unknown"}`,
  ].join(" ");

  const model = env.GEMINI_MODEL || "gemini-1.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const userParts = [{ text: userMessage }, ...buildImageParts(images)];

  const contents = [
    { role: "user", parts: [{ text: systemPolicy }] },
    ...mapHistoryToGeminiContents(history),
    { role: "user", parts: userParts },
  ];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const reply = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!reply || typeof reply !== "string") {
    throw new Error("Gemini returned an empty response");
  }

  return {
    reply: reply.trim(),
    outOfScope: false,
  };
}

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

module.exports = {
  DAILY_CHAT_LIMIT,
  generateAssistantReply,
  generateFallbackAssistantReply,
  getStartOfToday,
};
