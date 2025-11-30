import { Router } from "express";
import {
  createGroup,
  getGroupDetail,
  getGroupMembers,
  createInvitation,
  leaveGroup,
} from "../controllers/group.controller.js";

import { verifyToken } from "../middlewares/auth.js";

const router = Router();

// 그룹 생성
router.post("/", verifyToken, createGroup);

// 그룹 상세
router.get("/:groupId", verifyToken, getGroupDetail);

// 그룹 멤버
router.get("/:groupId/members", verifyToken, getGroupMembers);

// 초대 생성
router.post("/:groupId/invite", verifyToken, createInvitation);

// 그룹 나가기
router.delete("/:groupId/leave", verifyToken, leaveGroup);

export default router;