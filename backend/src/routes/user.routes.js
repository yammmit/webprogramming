import { Router } from "express";
import { getMyProfile, updateMyProfile, searchUsers } from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.js";
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get("/me", verifyToken, getMyProfile);
router.patch("/me", verifyToken, updateMyProfile);
router.get("/search", verifyToken, searchUsers);

// GET /users?ids=1,2,3  -> return { users: [...] }
router.get('/', async (req, res) => {
  try {
    const idsParam = req.query.ids;
    if (!idsParam) return res.json({ users: [] });
    const ids = String(idsParam).split(',').map(s => Number(s)).filter(n => !Number.isNaN(n));
    if (ids.length === 0) return res.json({ users: [] });
    const users = await prisma.user.findMany({ where: { user_id: { in: ids } }, select: { user_id: true, user_name: true } });
    return res.json({ users });
  } catch (err) {
    console.error('GET /users error', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;