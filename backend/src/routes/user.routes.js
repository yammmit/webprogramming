import { Router } from "express";
import { getMyProfile, updateMyProfile } from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

router.get("/me", verifyToken, getMyProfile);
router.patch("/me", verifyToken, updateMyProfile);

export default router;