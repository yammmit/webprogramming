import { Router } from "express";
import {
  createGroup,
  getGroupDetail,
  getGroupMembers,
  createInvitation,
  leaveGroup,
  getMyGroups,
  transferOwnership,
} from "../controllers/group.controller.js";
import { createTask } from "../controllers/task.controller.js";

import { verifyToken } from "../middlewares/auth.js";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// My groups
router.get("/", verifyToken, getMyGroups);

// 그룹 생성
router.post("/", verifyToken, createGroup);

// 그룹 상세
router.get("/:groupId", verifyToken, getGroupDetail);

// 그룹 멤버
router.get("/:groupId/members", verifyToken, getGroupMembers);

// 초대 생성
router.post("/:groupId/invite", verifyToken, createInvitation);

// create task
router.post("/:groupId/tasks", verifyToken, createTask);

// 그룹 소유권 이전
router.post("/:groupId/transfer-owner", verifyToken, transferOwnership);

// 그룹 나가기
router.delete("/:groupId/leave", verifyToken, leaveGroup);

// GET /groups/:groupId/members
router.get("/:groupId/members", async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const members = await prisma.groupMember.findMany({
      where: { group_id: groupId },
      include: { user: true },
    });
    const out = members.map((m) => ({
      user_id: m.user.user_id,
      user_name: m.user.user_name || m.user.name || null,
      role: m.role,
    }));
    return res.json(out);
  } catch (e) {
    console.error("GET /groups/:id/members error", e);
    return res.status(500).json({ error: "failed" });
  }
});

export default router;