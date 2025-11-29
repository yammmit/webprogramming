import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import testRoutes from "./routes/test.js";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// 라우터
app.use("/api", testRoutes);

// 서버 테스트용 엔드포인트
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});