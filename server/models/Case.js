import mongoose from "mongoose";

const SuspectSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  occupation: { type: String, required: true },
  description: { type: String, required: true },
  motive: { type: String, required: true }
}, { _id: false });

const ClueSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true }
}, { _id: false });

const CaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  premise: { type: String, required: true },
  story: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  suspects: { type: [SuspectSchema], required: true },
  clues: { type: [ClueSchema], required: true },
  hints: { type: [String], required: true, select: false },
  culpritId: { type: String, required: true, select: false },
  explanation: { type: String, required: true, select: false },
  discoveredClues: { type: [String], default: [] },
  hintsUsed: { type: Number, default: 0 },
  accusation: { type: String, default: null },
  score: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "completed"], default: "active" },
  verdictCorrect: { type: Boolean, default: null }
}, { timestamps: true });

export default mongoose.model("Case", CaseSchema);
