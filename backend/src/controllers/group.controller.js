import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const prisma = new PrismaClient();

// 0) 내 그룹 목록 조회
export const getMyGroups = async (req, res) => {
  try {
    const userId = Number(req.user?.sub);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId } } },
        ],
      },
      include: {
        owner: true,
        members: { include: { user: true } },
      },
    });

    return res.json(groups);
  } catch (err) {
    console.error("getMyGroups error:", err);
    return res.status(500).json({ error: "Failed to load groups" });
  }
};

// 1) 그룹 생성
export const createGroup = async (req, res) => {
  try {
    const { name, group_name } = req.body || {};
    const groupName = name || group_name;
    const userId = Number(req.user?.sub);

    if (!groupName) return res.status(400).json({ error: "Group name required" });
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // owner userId 찾기
    const owner = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!owner) return res.status(404).json({ error: "Owner not found" });

    const group = await prisma.group.create({
      data: {
        group_name: groupName,
        owner_id: owner.user_id,
        members: {
          create: {
            user: { connect: { user_id: owner.user_id } },
            role: "owner",
          },
        },
      },
      include: {
        members: { include: { user: true } },
        owner: true,
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
      where: { group_id: groupId },
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
      where: { group_id: groupId },
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
    const { user_id } = req.body || {};
    const inviterId = req.user?.sub ? Number(req.user.sub) : null;

    if (!user_id) return res.status(400).json({ error: "user_id required" });

    // verify group exists
    const group = await prisma.group.findUnique({ where: { group_id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    // create invitation record
    const invitation = await prisma.invitation.create({
      data: {
        group_id: groupId,
        invited_user_id: Number(user_id),
        invited_by: inviterId,
        status: "pending",
        created_at: new Date(),
      },
    });

    return res.json({
      invitation_id: invitation.invitation_id,
      status: invitation.status,
      created_at: invitation.created_at,
    });
  } catch (err) {
    console.error("createInvitation error:", err);
    return res.status(500).json({ error: "Failed to create invitation" });
  }
};

// 5) 그룹 탈퇴
export const leaveGroup = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.user?.sub);

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    await prisma.groupMember.deleteMany({
      where: {
        group_id: groupId,
        user_id: user.user_id,
      },
    });

    return res.json({ message: "Left group successfully" });
  } catch (err) {
    console.error("leaveGroup error:", err);
    return res.status(500).json({ error: "Failed to leave group" });
  }
};

// 6) 그룹 소유권 이전
export const transferOwnership = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const newOwnerId = Number(req.body.new_owner_id);
    const userId = Number(req.user?.sub);

    if (!newOwnerId) return res.status(400).json({ error: "new_owner_id required" });

    const group = await prisma.group.findUnique({
      where: { group_id: groupId },
      include: { members: true, owner: true },
    });
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Only current owner can transfer
    if (Number(group.owner_id) !== userId) return res.status(403).json({ error: "Only owner can transfer ownership" });

    // new owner must be a member of the group
    const isMember = group.members.some((gm) => Number(gm.user_id) === Number(newOwnerId));
    if (!isMember) return res.status(400).json({ error: "New owner must be a member of the group" });

    // Update group owner_id
    await prisma.group.update({ where: { group_id: groupId }, data: { owner_id: newOwnerId } });

    // update member roles: set previous owner's role to 'member' and new owner's role to 'owner'
    await prisma.groupMember.updateMany({ where: { group_id: groupId, user_id: userId }, data: { role: "member" } });
    await prisma.groupMember.updateMany({ where: { group_id: groupId, user_id: newOwnerId }, data: { role: "owner" } });

    const updated = await prisma.group.findUnique({
      where: { group_id: groupId },
      include: { members: { include: { user: true } }, owner: true },
    });
    return res.json({ group: updated });
  } catch (err) {
    console.error("transferOwnership error:", err);
    return res.status(500).json({ error: "Failed to transfer ownership" });
  }
};