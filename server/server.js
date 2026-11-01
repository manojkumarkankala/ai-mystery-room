import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import casesRouter from "./routes/cases.js";

const app = express();
app.disable("x-powered-by");

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  }
}));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "AI Mystery Room API" });
});

app.use("/api/cases", casesRouter);

app.use((req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON request body." });
  }
  if (err.name === "ZodError") {
    return res.status(400).json({
      message: "Invalid request data.",
      errors: err.issues
    });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid case ID." });
  }
  if (err.message?.includes("Origin is not allowed")) {
    return res.status(403).json({ message: "This website is not allowed to access the API." });
  }

  const isProduction = process.env.NODE_ENV === "production";
  res.status(500).json({
    message: isProduction
      ? "Something went wrong. Please try again."
      : (err.message || "Internal server error.")
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured.");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected successfully.");
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
