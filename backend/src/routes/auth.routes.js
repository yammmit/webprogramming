import 'dotenv/config';
import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const router = express.Router();

// POST /auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const existing = await prisma.user.findUnique({ where: { user_email: email } });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        user_email: email,
        user_name: name || null,
        user_password: hashed,
      },
    });

    const payload = { sub: user.user_id, email: user.user_email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "dev_jwt_secret", { expiresIn: "7d" });

    const safeUser = { ...user };
    delete safeUser.user_password;

    return res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error("/auth/signup error:", err);
    return res.status(500).json({ error: "Failed to signup" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const user = await prisma.user.findUnique({ where: { user_email: email } });
    if (!user || !user.user_password) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.user_password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const payload = { sub: user.user_id, email: user.user_email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "dev_jwt_secret", { expiresIn: "7d" });

    const safeUser = { ...user };
    delete safeUser.user_password;

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("/auth/login error:", err);
    return res.status(500).json({ error: "Failed to login" });
  }
});

export default router;