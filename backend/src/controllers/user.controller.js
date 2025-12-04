import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET /users/me
export const getMyProfile = async (req, res) => {
  try {
    const firebaseUser = req.user;

    if (!firebaseUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const uid = firebaseUser.uid;

    const user = await prisma.user.findUnique({
      where: { uid },
    });

    return res.json({ user });
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({ error: "Failed to load profile" });
  }
};

// PATCH /users/me
export const updateMyProfile = async (req, res) => {
  try {
    const firebaseUser = req.user;
    const { name } = req.body;

    if (!firebaseUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updated = await prisma.user.update({
      where: { uid: firebaseUser.uid },
      data: { name },
    });

    return res.json({ user: updated });
  } catch (err) {
    console.error("updateMyProfile error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

// GET /users/search
export const searchUsers = async (req, res) => {
  try {
    const q = (req.query.query || req.query.q || "").toString().trim();
    if (!q || q.length < 1) return res.json({ users: [] });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { user_email: { contains: q } },
          { user_name: { contains: q } },
        ],
      },
      select: {
        user_id: true,
        user_name: true,
        user_email: true,
      },
      take: 20,
    });

    return res.json({ users });
  } catch (err) {
    console.error('searchUsers error:', err);
    return res.status(500).json({ error: 'Failed to search users' });
  }
};