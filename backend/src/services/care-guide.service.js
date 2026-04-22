const CareGuide = require("../models/CareGuide");
const Application = require("../models/Application");

// Configuration for retry logic
const OPENAI_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
};

function buildFallbackGuide(pet, adopter) {
  const title = `${pet.name} Care Guide`;

  return `# ${title}

> ⚠️ **Disclaimer:** This AI-generated care guide must be verified by a licensed veterinarian before implementation.

## Pet Profile
- **Name:** ${pet.name}
- **Species:** ${pet.species}
- **Breed:** ${pet.breed}
- **Age:** ${pet.age} months
- **Weight:** ${pet.weight ?? "Not listed"} kg
- **Health status:** ${pet.healthStatus || "No special notes provided"}

## Daily Feeding
- Feed ${pet.species === "dog" ? "2-3" : "1-2"} measured meals per day.
- Adjust portions based on weight, breed, and body condition.
- Keep clean water available at all times.

## Grooming
- Brush coat regularly and check ears, teeth, and nails weekly.
- Schedule grooming based on coat type and shedding level.

## Exercise
- Provide at least 30-60 minutes of activity daily where appropriate.
- Use age-appropriate exercise and avoid overexertion.

## Vaccination and Health
- Follow the shelter's vaccination schedule.
- Monitor appetite, behaviour, and stool changes.
- Book a vet visit if symptoms change.

## Training and Behaviour
- Use positive reinforcement.
- Maintain routine and consistency.
- Introduce new environments gradually.

## Emergency Guidance
- Contact a licensed vet immediately for breathing issues, collapse, vomiting, or seizures.
- Keep the adoption paperwork and medical history accessible.

## Adopter Notes
- Assigned adopter: ${adopter.fullName}
- Generated automatically after adoption.
`;
}

async function generateOpenAiGuide(pet, adopter) {
  if (!process.env.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY not configured, using fallback guide");
    return null;
  }

  let lastError;

  for (let attempt = 1; attempt <= OPENAI_RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a veterinary assistant generating concise, safe pet care guides in markdown. Include a disclaimer that the guide must be verified by a licensed vet. Keep the guide to 1000 words maximum.",
            },
            {
              role: "user",
              content: `Generate a personalized pet care guide for this adopted pet and assigned adopter. Pet: ${JSON.stringify(
                {
                  name: pet.name,
                  species: pet.species,
                  breed: pet.breed,
                  age: pet.age,
                  weight: pet.weight,
                  healthStatus: pet.healthStatus,
                }
              )}. Adopter: ${JSON.stringify({ fullName: adopter.fullName })}.`,
            },
          ],
          temperature: 0.4,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error ${response.status}: ${errorData?.error?.message || "Unknown error"}`);
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      return content;
    } catch (error) {
      lastError = error;
      console.warn(`OpenAI API attempt ${attempt}/${OPENAI_RETRY_CONFIG.maxAttempts} failed:`, error.message);

      if (attempt < OPENAI_RETRY_CONFIG.maxAttempts) {
        const delayMs = Math.min(OPENAI_RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt - 1), OPENAI_RETRY_CONFIG.maxDelayMs);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error("All OpenAI API attempts exhausted, using fallback guide. Last error:", lastError.message);
  return null;
}

async function generateCareGuide({ pet, adopter, application }) {
  const previousGuide = await CareGuide.findOne({ pet: pet._id, adopter: adopter._id, archived: false })
    .sort({ version: -1 });

  const openAiContent = await generateOpenAiGuide(pet, adopter);
  const content = openAiContent || buildFallbackGuide(pet, adopter);

  if (previousGuide) {
    previousGuide.archived = true;
    await previousGuide.save();
  }

  const guide = await CareGuide.create({
    pet: pet._id,
    adopter: adopter._id,
    content,
    sourceType: "system_generated",
    author: null,
    approvalStatus: "approved",
    approvedBy: null,
    approvedAt: new Date(),
    vetVerified: false,
    verifiedBy: null,
    verifiedAt: null,
    version: previousGuide ? previousGuide.version + 1 : 1,
    archived: false,
  });

  return guide;
}

async function getActiveGuide(petId, adopterId, options = {}) {
  const query = { pet: petId, adopter: adopterId, archived: false };

  if (!options.includePending) {
    query.approvalStatus = "approved";
  }

  return CareGuide.findOne(query)
    .sort({ version: -1 })
    .populate({ path: "pet", select: "name species breed age photos healthStatus" })
    .populate({ path: "adopter", select: "fullName email role" })
    .populate({ path: "verifiedBy", select: "fullName email role" })
    .populate({ path: "author", select: "fullName email role" })
    .populate({ path: "approvedBy", select: "fullName email role" });
}

async function createVetAuthoredGuide({ pet, adopter, authorId, content }) {
  const previousGuide = await CareGuide.findOne({ pet: pet._id, adopter: adopter._id, archived: false })
    .sort({ version: -1 });

  if (previousGuide) {
    previousGuide.archived = true;
    await previousGuide.save();
  }

  const guide = await CareGuide.create({
    pet: pet._id,
    adopter: adopter._id,
    content,
    sourceType: "vet_authored",
    author: authorId,
    approvalStatus: "pending_approval",
    approvedBy: null,
    approvedAt: null,
    vetVerified: true,
    verifiedBy: authorId,
    verifiedAt: new Date(),
    version: previousGuide ? previousGuide.version + 1 : 1,
    archived: false,
  });

  return guide;
}

async function listPendingGuides({ page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;

  const query = {
    archived: false,
    sourceType: "vet_authored",
    approvalStatus: "pending_approval",
  };

  const [totalCount, guides] = await Promise.all([
    CareGuide.countDocuments(query),
    CareGuide.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "pet", select: "name species breed age photos healthStatus" })
      .populate({ path: "adopter", select: "fullName email role" })
      .populate({ path: "author", select: "fullName email role" })
      .populate({ path: "approvedBy", select: "fullName email role" }),
  ]);

  return {
    guides,
    page,
    limit,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
  };
}

async function approveGuide(guideId, approverId, decision) {
  const guide = await CareGuide.findById(guideId)
    .populate({ path: "pet", select: "name species breed age photos healthStatus" })
    .populate({ path: "adopter", select: "fullName email role" })
    .populate({ path: "author", select: "fullName email role" })
    .populate({ path: "approvedBy", select: "fullName email role" });

  if (!guide || guide.archived) {
    throw new Error("Care guide not found");
  }

  guide.approvalStatus = decision;
  guide.approvedBy = approverId;
  guide.approvedAt = new Date();
  await guide.save();

  return CareGuide.findById(guide._id)
    .populate({ path: "pet", select: "name species breed age photos healthStatus" })
    .populate({ path: "adopter", select: "fullName email role" })
    .populate({ path: "verifiedBy", select: "fullName email role" })
    .populate({ path: "author", select: "fullName email role" })
    .populate({ path: "approvedBy", select: "fullName email role" });
}

async function ensureGuideForAdoptedApplication(applicationId) {
  const application = await Application.findById(applicationId)
    .populate("pet")
    .populate("applicant");

  if (!application || application.status !== "adopted") {
    return null;
  }

  return generateCareGuide({
    pet: application.pet,
    adopter: application.applicant,
    application,
  });
}

function generatePdfContent(guide) {
  // Convert markdown to simple text-based HTML for PDF generation
  const markdownToHtml = (markdown) => {
    let html = markdown
      .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
      .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
      .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
      .replace(/^\> (.*?)$/gm, "<blockquote>$1</blockquote>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^- (.*?)$/gm, "<li>$1</li>")
      .replace(/(?:<li>.*?<\/li>[\r\n]*)+/g, (match) => `<ul>${match}</ul>`)
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>");

    return `<html><body style="font-family: Arial, sans-serif; line-height: 1.6;">${html}</body></html>`;
  };

  return {
    html: markdownToHtml(guide.content),
    fileName: `${guide.pet.name}_care_guide_v${guide.version}.pdf`,
  };
}

module.exports = {
  generateCareGuide,
  getActiveGuide,
  ensureGuideForAdoptedApplication,
  generatePdfContent,
  createVetAuthoredGuide,
  listPendingGuides,
  approveGuide,
};
