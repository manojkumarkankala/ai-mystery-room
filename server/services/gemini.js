import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const configurations = {
  easy: { suspects: 3, clues: 5, hints: 2 },
  medium: { suspects: 4, clues: 7, hints: 3 },
  hard: { suspects: 5, clues: 9, hints: 3 }
};

const MysterySchema = z.object({
  title: z.string().min(3).max(120),
  story: z.string().min(30).max(5000),
  suspects: z.array(z.object({
    id: z.string().min(1).max(40),
    name: z.string().min(1).max(80),
    age: z.number().int().min(18).max(110),
    occupation: z.string().min(1).max(100),
    description: z.string().min(10).max(1000),
    motive: z.string().min(3).max(500)
  })),
  clues: z.array(z.object({
    id: z.string().min(1).max(40),
    title: z.string().min(1).max(100),
    description: z.string().min(5).max(1000),
    location: z.string().min(1).max(100)
  })),
  hints: z.array(z.string().min(5).max(500)),
  culpritId: z.string().min(1).max(40),
  explanation: z.string().min(20).max(3000)
});

export async function generateMystery(premise, difficulty) {
  const config = configurations[difficulty];
  if (!config) throw new Error("Invalid difficulty");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert fair-play detective mystery writer.
Create an original, solvable mystery based on this premise:
${premise}

Difficulty: ${difficulty}
Return exactly:
- ${config.suspects} suspects
- ${config.clues} clues
- ${config.hints} progressive hints

Rules:
- Use unique IDs for every suspect and clue.
- culpritId must exactly match one suspect id.
- The clues must provide enough evidence to infer the culprit.
- Ensure the explanation explicitly connects evidence to the culprit.
- Include plausible red herrings, but do not make the solution arbitrary.
- Hints must be progressive and must not directly reveal the culprit.
- All suspect ages must be adults (18+).
- Return JSON only, following the requested response schema.
`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.7
    }
  });

  let parsed;
  try {
    parsed = JSON.parse(response.text);
  } catch {
    throw new Error("Gemini returned invalid JSON. Please generate again.");
  }

  const mystery = MysterySchema.parse(parsed);

  if (
    mystery.suspects.length !== config.suspects ||
    mystery.clues.length !== config.clues ||
    mystery.hints.length !== config.hints
  ) {
    throw new Error("Gemini returned incorrect mystery counts. Please try again.");
  }

  const suspectIds = mystery.suspects.map((item) => item.id);
  const clueIds = mystery.clues.map((item) => item.id);

  if (new Set(suspectIds).size !== suspectIds.length) {
    throw new Error("Gemini returned duplicate suspect IDs.");
  }
  if (new Set(clueIds).size !== clueIds.length) {
    throw new Error("Gemini returned duplicate clue IDs.");
  }
  if (!suspectIds.includes(mystery.culpritId)) {
    throw new Error("Gemini returned an invalid culprit reference.");
  }

  return mystery;
}
