import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import testRoutes from "./routes/test.js";
import jwtAuth from "./middlewares/jwtAuth.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import ladderRoutes from "./routes/ladder.routes.js";
import userRouter from "./routes/user.routes.js";
import groupRouter from "./routes/group.routes.js";
import taskRouter from './routes/task.routes.js';
import invitationRouter from './routes/invitation.routes.js';


const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Mount auth routes (signup/login) before JWT auth so signup/login are public
app.use("/auth", authRoutes);

// JWT auth applied to routes below
app.use(jwtAuth);

// Protected application routes
app.use("/", taskRoutes);
app.use("/", ladderRoutes);
app.use("/users", jwtAuth, userRouter);
app.use("/groups", jwtAuth, groupRouter);

// 라우터
app.use("/api", testRoutes);
app.use("/users", jwtAuth, userRouter);
app.use("/groups", jwtAuth, groupRouter);
app.use("/", jwtAuth, taskRouter);
app.use("/", jwtAuth, invitationRouter);
app.use('/invitations', jwtAuth, invitationRouter);

// 서버 테스트용 엔드포인트
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});