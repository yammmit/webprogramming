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