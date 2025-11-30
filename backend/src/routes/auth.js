import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const router = express.Router();

console.log("auth routes module loaded (jwt mode)");

// Health check for auth routes
router.get("/auth/ping", (req, res) => {
  console.log("auth ping received", { method: req.method, path: req.originalUrl });
  return res.json({ message: "auth pong" });
});

// POST /api/auth/signup -- accept backend JWT and upsert user by email
router.post("/auth/signup", async (req, res) => {
  try {
    console.log('body', req.body);
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: "idToken required" });

    // Verify token with server JWT secret (not Firebase Admin)
    let decoded;
    try {
      decoded = jwt.verify(idToken, process.env.JWT_SECRET || 'dev_jwt_secret');
    } catch (e) {
      console.error('jwt verify failed:', e.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('decoded', decoded);

    const email = decoded.email || null;
    const name = decoded.name || decoded.displayName || null;

    if (!email) {
      return res.status(400).json({ error: "No email in token" });
    }

    // Upsert user by email using Prisma
    const user = await prisma.user.upsert({
      where: { user_email: email },
      update: {
        user_name: name || undefined,
        user_password_updated_at: new Date(),
      },
      create: {
        user_email: email,
        user_name: name || null,
        user_password: "", // placeholder
      },
    });

    console.log('upsert result', user);

    return res.json({ message: "User upserted (jwt)", user });
  } catch (err) {
    console.error("/auth/signup error:", err.message || err);
    console.error(err.stack || 'no stack');
    return res.status(500).json({ error: "Failed to process signup" });
  }
});

export default router;