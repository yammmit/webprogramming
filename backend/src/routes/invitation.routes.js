import { Router } from "express";
import { acceptInvitation, rejectInvitation } from "../controllers/invitation.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

router.post("/invitations/:invitationId/accept", verifyToken, acceptInvitation);
router.delete("/invitations/:invitationId/reject", verifyToken, rejectInvitation);

export default router;