import { Router } from "express";
import {
  createTask,
  updateTask,
  getGroupTasks,
  getTodayTasks,
} from "../controllers/task.controller.js";

import { verifyToken } from "../middlewares/auth.js";

const router = Router();

// 할 일 생성
router.post("/groups/:groupId/tasks", verifyToken, createTask);

// 특정 그룹의 모든 Task
router.get("/groups/:groupId/tasks", verifyToken, getGroupTasks);

// Task 업데이트(isDone 변경)
router.patch("/tasks/:taskId", verifyToken, updateTask);

// 오늘의 Task
router.get("/tasks/today", verifyToken, getTodayTasks);

export default router;