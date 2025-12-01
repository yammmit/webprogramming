import { Router } from "express";
import {
  createTask,
  updateTask,
  getGroupTasks,
  getTaskById,
  assignTask,
  completeTask,
  getTaskEvaluations,
  createTaskEvaluation,
  getTaskHistory,
  getGroupHistory,
} from "../controllers/task.controller.js";

import { verifyToken } from "../middlewares/auth.js";

const router = Router();

// 할 일 생성
router.post("/groups/:groupId/tasks", verifyToken, createTask);

// 특정 그룹의 모든 Task
router.get("/groups/:groupId/tasks", verifyToken, getGroupTasks);

// Task 업데이트(isDone 변경)
router.patch("/tasks/:taskId", verifyToken, updateTask);

// Assign task
router.post("/tasks/:taskId/assign", verifyToken, assignTask);

// Complete task
router.post("/tasks/:taskId/complete", verifyToken, completeTask);

// Get single task
router.get("/tasks/:taskId", verifyToken, getTaskById);

// Evaluations
router.get("/tasks/:taskId/evaluations", verifyToken, getTaskEvaluations);
router.post("/tasks/:taskId/evaluations", verifyToken, createTaskEvaluation);
router.get("/tasks/:taskId/history", verifyToken, getTaskHistory);
router.get("/groups/:groupId/history", verifyToken, getGroupHistory);

export default router;