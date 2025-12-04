import { Router } from "express";
import { getMyInvitations, acceptInvitation, deleteInvitation } from "../controllers/invitation.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

router.get("/invitations", verifyToken, getMyInvitations);
router.post("/invitations/:invitationId/accept", verifyToken, acceptInvitation);
router.delete("/invitations/:invitationId", verifyToken, deleteInvitation);

export default router;