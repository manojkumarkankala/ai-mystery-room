import express from "express";
import { z } from "zod";
import Case from "../models/Case.js";
import { generateMystery } from "../services/gemini.js";

const router = express.Router();

const difficultyScores = { easy: 100, medium: 150, hard: 200 };

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function publicCase(game) {
  const data = game.toObject();
  delete data.culpritId;
  delete data.explanation;
  delete data.hints;
  delete data.__v;

  data.totalHints = game.hints?.length;
  data.remainingHints = Math.max(0, (game.hints?.length ?? 0) - game.hintsUsed);
  data.clues = data.clues.map((clue) => {
    const discovered = game.discoveredClues.includes(clue.id);
    return {
      id: clue.id,
      title: clue.title,
      location: clue.location,
      discovered,
      description: discovered ? clue.description : null
    };
  });
  return data;
}

router.post("/", asyncHandler(async (req, res) => {
  const input = z.object({
    premise: z.string().trim().min(10).max(500),
    difficulty: z.enum(["easy", "medium", "hard"])
  }).parse(req.body);

  const mystery = await generateMystery(input.premise, input.difficulty);
  const game = await Case.create({
    ...mystery,
    premise: input.premise,
    difficulty: input.difficulty
  });

  res.status(201).json({
    message: "Mystery generated successfully",
    game: publicCase(game)
  });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const game = await Case.findById(req.params.id).select("+hints");
  if (!game) return res.status(404).json({ message: "Mystery not found" });
  if (game.status !== "active") {
    return res.status(409).json({ message: "This mystery is already completed." });
  }
  res.json({ game: publicCase(game) });
}));

router.post("/:id/clues/:clueId/discover", asyncHandler(async (req, res) => {
  const game = await Case.findById(req.params.id).select("+hints");
  if (!game) return res.status(404).json({ message: "Mystery not found" });
  if (game.status !== "active") return res.status(409).json({ message: "Game is completed." });

  const clue = game.clues.find((item) => item.id === req.params.clueId);
  if (!clue) return res.status(404).json({ message: "Clue not found." });

  const alreadyDiscovered = game.discoveredClues.includes(clue.id);
  if (!alreadyDiscovered) {
    game.discoveredClues.push(clue.id);
    await game.save();
  }

  res.json({
    message: alreadyDiscovered ? "Clue already discovered." : "Clue discovered.",
    clue: { id: clue.id, title: clue.title, location: clue.location, description: clue.description },
    discoveredCount: game.discoveredClues.length,
    scoreBonus: alreadyDiscovered ? 0 : 5
  });
}));

router.post("/:id/hints", asyncHandler(async (req, res) => {
  const game = await Case.findById(req.params.id).select("+hints");
  if (!game) return res.status(404).json({ message: "Mystery not found" });
  if (game.status !== "active") return res.status(409).json({ message: "Game is completed." });
  if (game.hintsUsed >= game.hints.length) {
    return res.status(400).json({ message: "No more hints available." });
  }

  const hint = game.hints[game.hintsUsed];
  game.hintsUsed += 1;
  await game.save();

  res.json({
    hint,
    hintsUsed: game.hintsUsed,
    remainingHints: game.hints.length - game.hintsUsed,
    scorePenalty: 10
  });
}));

router.post("/:id/accuse", asyncHandler(async (req, res) => {
  const { suspectId } = z.object({ suspectId: z.string().min(1).max(40) }).parse(req.body);

  const game = await Case.findById(req.params.id).select("+culpritId +explanation +hints");
  if (!game) return res.status(404).json({ message: "Mystery not found" });
  if (game.status !== "active") return res.status(409).json({ message: "This case has already been completed." });

  if (!game.suspects.some((suspect) => suspect.id === suspectId)) {
    return res.status(400).json({ message: "Invalid suspect selection." });
  }

  const correct = suspectId === game.culpritId;
  const baseScore = correct ? difficultyScores[game.difficulty] : 0;
  const clueBonus = correct ? game.discoveredClues.length * 5 : 0;
  const hintPenalty = game.hintsUsed * 10;
  const score = correct ? Math.max(0, baseScore + clueBonus - hintPenalty) : 0;

  game.accusation = suspectId;
  game.score = score;
  game.verdictCorrect = correct;
  game.status = "completed";
  await game.save();

  res.json({
    message: "Accusation submitted.",
    result: {
      correct,
      culprit: game.suspects.find((suspect) => suspect.id === game.culpritId),
      explanation: game.explanation,
      score,
      baseScore,
      discoveredClues: game.discoveredClues.length,
      clueBonus,
      hintsUsed: game.hintsUsed,
      hintPenalty,
      verdict: correct ? "Correct accusation!" : "Wrong accusation!"
    }
  });
}));

router.get("/:id/result", asyncHandler(async (req, res) => {
  const game = await Case.findById(req.params.id).select("+culpritId +explanation");
  if (!game) return res.status(404).json({ message: "Mystery not found" });
  if (game.status !== "completed") {
    return res.status(403).json({ message: "Submit an accusation to reveal the result." });
  }

  res.json({
    result: {
      correct: game.verdictCorrect,
      culprit: game.suspects.find((suspect) => suspect.id === game.culpritId),
      explanation: game.explanation,
      score: game.score,
      discoveredClues: game.discoveredClues.length,
      hintsUsed: game.hintsUsed,
      baseScore: game.verdictCorrect ? difficultyScores[game.difficulty] : 0,
      clueBonus: game.verdictCorrect ? game.discoveredClues.length * 5 : 0,
      hintPenalty: game.hintsUsed * 10
    }
  });
}));

export default router;
