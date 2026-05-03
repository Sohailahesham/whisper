import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import crypto from "crypto";

console.log(crypto.randomBytes(50).toString("hex"));

const app = express();
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/feed", feedRoutes);

app.use(express.static("public"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

await connectDB();
app.listen(PORT, () => console.log(`whisper listening on ${PORT}`));

export default app;
