import { Router } from "express";
import { login, me } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

// 로그인 (토큰을 body로 받음)
router.post("/login", login);

// 내 정보 (Authorization Bearer 토큰 필요)
router.get("/me", verifyToken, me);

export default router;