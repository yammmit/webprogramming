import { Router } from "express";
import { getMyInvitations, acceptInvitation, deleteInvitation } from "../controllers/invitation.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

// list invitations (mounted at /invitations)
router.get("/", verifyToken, getMyInvitations);
// accept invitation
router.post("/:invitationId/accept", verifyToken, acceptInvitation);
// delete (decline) invitation
router.delete("/:invitationId", verifyToken, deleteInvitation);

export default router;