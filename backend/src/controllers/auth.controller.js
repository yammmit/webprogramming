import { PrismaClient } from "@prisma/client";
import admin from "../firebase/admin.js";

const prisma = new PrismaClient();

/**
 * POST /auth/login
 * 프론트에서 Firebase ID Token 보내면
 * → 백엔드가 검증하고
 * → User 테이블에 upsert 해서 저장
 */
export const login = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }

    // Firebase 검증
    const decoded = await admin.auth().verifyIdToken(idToken);

    const uid = decoded.uid;
    const email = decoded.email ?? null;
    const name = decoded.name ?? null;

    // DB에 사용자 저장 or 업데이트
    const user = await prisma.user.upsert({
      where: { uid },
      update: {
        email,
        name,
      },
      create: {
        uid,
        email,
        name,
      },
    });

    return res.json({
      message: "Login success",
      user,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * GET /auth/me
 * Authorization: Bearer <idToken>
 */
export const me = async (req, res) => {
  try {
    const firebaseUser = req.user; // 기존 verifyToken이 req.user에 저장함

    if (!firebaseUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const uid = firebaseUser.uid;
    const email = firebaseUser.email ?? null;
    const name = firebaseUser.name ?? null;

    // DB에서 upsert (동기화)
    const user = await prisma.user.upsert({
      where: { uid },
      update: { email, name },
      create: {
        uid,
        email,
        name,
      },
    });

    return res.json({ user });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ error: "Failed to load user info" });
  }
};