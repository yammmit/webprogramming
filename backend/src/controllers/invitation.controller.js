import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 초대 수락
export const acceptInvitation = async (req, res) => {
  try {
    const invitationId = Number(req.params.invitationId);
    const uid = req.user.uid;

    // 유저 ID 찾기
    const user = await prisma.user.findUnique({
      where: { uid },
    });

    const invite = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invite) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    // 이미 그룹에 있으면 막기
    const alreadyMember = await prisma.groupMember.findFirst({
      where: {
        groupId: invite.groupId,
        userId: user.id,
      },
    });

    if (alreadyMember) {
      return res.status(400).json({ error: "Already a member" });
    }

    // 수락 → GroupMember 추가
    await prisma.groupMember.create({
      data: {
        groupId: invite.groupId,
        userId: user.id,
      },
    });

    // 초대 삭제
    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return res.json({ message: "Invitation accepted" });
  } catch (err) {
    console.error("acceptInvitation error:", err);
    return res.status(500).json({ error: "Failed to accept invitation" });
  }
};

// 초대 거절
export const rejectInvitation = async (req, res) => {
  try {
    const invitationId = Number(req.params.invitationId);

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return res.json({ message: "Invitation rejected" });
  } catch (err) {
    console.error("rejectInvitation error:", err);
    return res.status(500).json({ error: "Failed to reject invitation" });
  }
};