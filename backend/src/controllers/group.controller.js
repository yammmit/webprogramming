import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 1) 그룹 생성
export const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const uid = req.user.uid;

    if (!name) return res.status(400).json({ error: "Group name required" });

    // owner userId 찾기
    const owner = await prisma.user.findUnique({
      where: { uid },
    });

    const group = await prisma.group.create({
      data: {
        name,
        ownerId: owner.id,
        members: {
          create: {
            userId: owner.id,
            role: "owner",
          },
        },
      },
    });

    return res.json({ group });
  } catch (err) {
    console.error("createGroup error:", err);
    return res.status(500).json({ error: "Failed to create group" });
  }
};

// 2) 그룹 상세 조회
export const getGroupDetail = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: true,
      },
    });

    if (!group) return res.status(404).json({ error: "Group not found" });

    return res.json({ group });
  } catch (err) {
    console.error("getGroupDetail error:", err);
    return res.status(500).json({ error: "Failed to load group" });
  }
};

// 3) 그룹 멤버 조회
export const getGroupMembers = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
    });

    return res.json({ members });
  } catch (err) {
    console.error("getGroupMembers error:", err);
    return res.status(500).json({ error: "Failed to load members" });
  }
};

// 4) 그룹 초대 생성
export const createInvitation = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });

    const token = crypto.randomUUID();

    const invitation = await prisma.invitation.create({
      data: {
        groupId,
        email,
        token,
      },
    });

    return res.json({ invitation });
  } catch (err) {
    console.error("createInvitation error:", err);
    return res.status(500).json({ error: "Failed to create invitation" });
  }
};

// 5) 그룹 탈퇴
export const leaveGroup = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const uid = req.user.uid;

    const user = await prisma.user.findUnique({ where: { uid } });

    await prisma.groupMember.deleteMany({
      where: {
        groupId,
        userId: user.id,
      },
    });

    return res.json({ message: "Left group successfully" });
  } catch (err) {
    console.error("leaveGroup error:", err);
    return res.status(500).json({ error: "Failed to leave group" });
  }
};