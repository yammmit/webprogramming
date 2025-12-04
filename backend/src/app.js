import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import groupRouter from "./routes/group.routes.js";
import taskRouter from "./routes/task.routes.js";
import ladderRouter from "./routes/ladder.routes.js";
import invitationRouter from "./routes/invitation.routes.js";

import jwtAuth from "./middlewares/jwtAuth.js";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Public routes
app.use("/auth", authRoutes);

// JWT protected routes
app.use(jwtAuth);

// Mount protected routers (NO DUPLICATES)
app.use("/users", userRouter);
app.use("/groups", groupRouter);
app.use("/tasks", taskRouter);
app.use("/ladder", ladderRouter);
app.use("/invitations", invitationRouter);

// health check
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
