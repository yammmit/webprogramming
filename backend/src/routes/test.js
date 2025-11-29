import express from "express";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

// 인증이 필요한 테스트 API
router.get("/me", verifyToken, (req, res) => {
  res.json({
    message: "Token valid",
    user: req.user,
  });
});

export default router;