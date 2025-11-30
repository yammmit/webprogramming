import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getMyInvitations = async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const invitations = await prisma.invitation.findMany({
      where: { invited_user_id: userId, status: "pending" },
      orderBy: { created_at: "desc" },
    });

    const result = await Promise.all(
      invitations.map(async (inv) => {
        const group = await prisma.group.findUnique({
          where: { group_id: inv.group_id },
        });
        const inviter = inv.invited_by
          ? await prisma.user.findUnique({
              where: { user_id: inv.invited_by },
            })
          : null;
        return {
          invitation_id: inv.invitation_id,
          group_id: inv.group_id,
          group_name: group?.group_name || null,
          invited_by: inviter
            ? { user_id: inviter.user_id, user_name: inviter.user_name }
            : null,
          status: inv.status,
          created_at: inv.created_at,
        };
      })
    );

    return res.json(result);
  } catch (err) {
    console.error("getMyInvitations error:", err);
    return res.status(500).json({ error: "Failed to load invitations" });
  }
};

// 초대 수락
export const acceptInvitation = async (req, res) => {
  try {
    const invitationId = Number(req.params.invitationId);
    const userId = Number(req.user?.sub);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const inv = await prisma.invitation.findUnique({
      where: { invitation_id: invitationId },
    });
    if (!inv) return res.status(404).json({ error: "Invitation not found" });
    if (Number(inv.invited_user_id) !== userId)
      return res.status(403).json({ error: "Not allowed" });

    // 그룹 멤버 추가 (존재하지 않는 경우에만)
    const existing = await prisma.groupMember.findFirst({
      where: { group_id: inv.group_id, user_id: userId },
    });
    if (!existing) {
      await prisma.groupMember.create({
        data: { group_id: inv.group_id, user_id: userId, role: "member" },
      });
    }

    // 초대 수락 처리
    await prisma.invitation.update({
      where: { invitation_id: invitationId },
      data: { status: "accepted" },
    });

    return res.json({ message: "accepted", group_id: inv.group_id });
  } catch (err) {
    console.error("acceptInvitation error:", err);
    return res.status(500).json({ error: "Failed to accept invitation" });
  }
};

// 초대 삭제
export const deleteInvitation = async (req, res) => {
  try {
    const invitationId = Number(req.params.invitationId);
    const userId = Number(req.user?.sub);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const inv = await prisma.invitation.findUnique({
      where: { invitation_id: invitationId },
    });
    if (!inv) return res.status(404).json({ error: "Invitation not found" });
    if (Number(inv.invited_user_id) !== userId)
      return res.status(403).json({ error: "Not allowed" });

    await prisma.invitation.delete({ where: { invitation_id: invitationId } });
    return res.json({ message: "deleted" });
  } catch (err) {
    console.error("deleteInvitation error:", err);
    return res.status(500).json({ error: "Failed to delete invitation" });
  }
};