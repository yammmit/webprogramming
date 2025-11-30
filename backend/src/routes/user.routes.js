import { Router } from "express";
import { getMyProfile, updateMyProfile, searchUsers } from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

router.get("/me", verifyToken, getMyProfile);
router.patch("/me", verifyToken, updateMyProfile);
router.get("/search", verifyToken, searchUsers);

export default router;