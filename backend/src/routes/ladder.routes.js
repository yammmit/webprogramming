import { Router } from 'express';
import { voteForLadder, getLadderStatus, assignLadder } from '../controllers/ladder.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

// legacy endpoints (compat)
router.post('/tasks/:taskId/vote', verifyToken, voteForLadder);
// legacy ladder-run mapped to assignLadder
router.post('/tasks/:taskId/ladder-run', verifyToken, assignLadder);

// new endpoints under /tasks/:taskId/ladder
router.post('/tasks/:taskId/ladder/vote', verifyToken, voteForLadder);
router.get('/tasks/:taskId/ladder/status', verifyToken, getLadderStatus);
router.post('/tasks/:taskId/ladder/assign', verifyToken, assignLadder);

export default router;
