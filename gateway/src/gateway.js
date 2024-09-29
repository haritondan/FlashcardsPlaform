import express from "express";
import authRoutes from "./routes/authRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/flashcards", flashcardRoutes);

app.listen(8080, () => {
  console.log("Gateway running on port 8080");
});
