import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

const app = express();
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/feed", feedRoutes);

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use(express.static(publicDir));

app.use(notFound);
app.use(errorHandler);

export default app;
