import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// utility to generate ladder_map and result_map
function generateLadder(participants, rows = 9, seed = 1) {
  const columns = participants.length;
  // seeded RNG
  let t = seed >>> 0;
  function rand() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), r | 61)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }

  // connections: rows x (columns-1)
  const ladder_map = [];
  const connections = Array.from({ length: rows }).map(() => Array(columns - 1).fill(false));

  for (let r = 0; r < rows; r++) {
    let prev = false;
    for (let c = 0; c < columns - 1; c++) {
      if (prev) { prev = false; continue; }
      if (rand() < 0.3) {
        connections[r][c] = true;
        ladder_map.push({ row: r + 1, column: c + 1 });
        prev = true;
      }
    }
  }

  // compute result_map: start col -> end col
  const result_map = {};
  for (let start = 1; start <= columns; start++) {
    let cur = start - 1; // zero-based
    for (let r = 0; r < rows; r++) {
      if (connections[r][cur]) { cur = cur + 1; continue; }
      if (cur - 1 >= 0 && connections[r][cur - 1]) { cur = cur - 1; continue; }
    }
    result_map[String(start)] = cur + 1;
  }

  return { ladder_map, result_map, participants };
}

// POST /tasks/:taskId/ladder/vote
export const voteForLadder = async (req, res) => {
  try {
    // ensure Prisma client has LadderVote model available (migration applied + client regenerated)
    if (!prisma.ladderVote || typeof prisma.ladderVote.upsert !== 'function') {
      console.error('Prisma ladderVote model not available. Did you run prisma migrate and regenerate client?');
      return res.status(500).json({ error: 'Server misconfiguration: LadderVote model missing. Run prisma migrate dev and restart server.' });
    }
    const taskId = Number(req.params.taskId);
    const { vote } = req.body ?? { vote: true };
    const auth = req.user;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    // expect JWT payload to include 'sub' (user_id). Fall back to other fields if present.
    const userId = Number(auth.sub || auth.user_id || auth.id || 0);
    if (!userId) return res.status(401).json({ error: 'Unauthorized: user id not found in token' });

    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const groupId = task.group_id;

    // members
    let members = [];
    try { members = await prisma.groupMember.findMany({ where: { group_id: groupId }, select: { user_id: true } }); }
    catch (e) { try { members = await prisma.groupMembership.findMany({ where: { group_id: groupId }, select: { user_id: true } }); } catch (e2) { const g = await prisma.group.findUnique({ where: { group_id: groupId }, include: { members: true } }); members = (g?.members || []).map(m=>({ user_id: m.user_id })); } }
    const totalMembers = (members || []).length;
    // ensure voter is member of the group
    const isMember = members.some(m => Number(m.user_id) === Number(userId));
    if (!isMember) return res.status(403).json({ error: 'You are not a member of this group' });

    // upsert
    await prisma.ladderVote.upsert({
      where: { task_id_user_id: { task_id: taskId, user_id: userId } },
      update: { vote: Boolean(vote), created_at: new Date() },
      create: { task_id: taskId, user_id: userId, vote: Boolean(vote) },
    });

    const votes = await prisma.ladderVote.count({ where: { task_id: taskId, vote: true } });
    const required = Math.ceil(totalMembers / 2);
    const majority = votes >= required;

    return res.json({ votes, total_members: totalMembers, required, majority });
  } catch (err) {
    console.error('voteForLadder error:', err);
    return res.status(500).json({ error: 'Failed to register vote' });
  }
};

// GET /tasks/:taskId/ladder/status
export const getLadderStatus = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // fetch group members count
    const members = await prisma.groupMember.findMany({ where: { group_id: task.group_id } });
    const total_members = members.length;

    // count votes for this task
    const votes = await prisma.ladderVote.count({ where: { task_id: taskId, vote: true } });
    const required = Math.ceil(total_members / 2);
    const majority = votes >= required;

    return res.json({ total_members, votes, required, majority });
  } catch (err) {
    console.error('getLadderStatus error:', err);
    return res.status(500).json({ error: 'Failed to get ladder status' });
  }
};

// POST /tasks/:taskId/ladder/assign
export const assignLadder = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const members = await prisma.groupMember.findMany({ where: { group_id: task.group_id }, include: { user: true } });
    const total_members = members.length;
    if (!total_members) return res.status(400).json({ error: 'No members in group' });

    // check existing LadderResult
    const existing = await prisma.ladderResult.findFirst({ where: { task_id: taskId } });
    if (existing) {
      return res.json({ ladder_id: existing.ladder_id, assigned_to: existing.assigned_to });
    }

    // compute votes and required
    const votes = await prisma.ladderVote.count({ where: { task_id: taskId, vote: true } });
    const required = Math.ceil(total_members / 2);
    if (votes < required) return res.status(400).json({ error: 'Not enough votes to run ladder', votes, total_members, required });

    // participants order: use group members order
    const participants = members.map(m => ({ user_id: m.user.user_id, user_name: m.user.user_name }));

    // generate ladder structure (rows between 7 and 12)
    const rows = 7 + Math.floor(Math.random() * 6); // 7..12
    const seed = Number(taskId) || Date.now();
    const { ladder_map, result_map } = generateLadder(participants, rows, seed);

    // generate bottom_result: one winner, rest losers
    const bottom_result = Array.from({ length: participants.length }).map(() => '꽝');
    const winnerPos = Math.floor(Math.random() * participants.length); // 0-based
    bottom_result[winnerPos] = '당첨';

    // determine assigned user: find which participant maps to the winner bottom column
    // result_map maps startCol -> endCol
    // find startCol such that result_map[startCol] == (winnerPos+1)
    let assignedParticipant = participants[0];
    for (let s = 1; s <= participants.length; s++) {
      const end = result_map[String(s)];
      if (Number(end) === (winnerPos + 1)) {
        assignedParticipant = participants[s - 1];
        break;
      }
    }

    // store LadderResult
    const lr = await prisma.ladderResult.create({ data: {
      task_id: taskId,
      group_id: task.group_id,
      participants: participants,
      ladder_map: ladder_map,
      result_map: result_map,
      bottom_result: bottom_result,
      assigned_to: assignedParticipant.user_id,
    }});

    // create taskAssignment
    const assignment = await prisma.taskAssignment.create({ data: { task_id: taskId, assigned_to: assignedParticipant.user_id, assignment_type: 'ladder', status: 'assigned' } });
    try { await prisma.task.update({ where: { task_id: taskId }, data: { status: 'assigned' } }); } catch (e) {}

    return res.json({ ladder_id: lr.ladder_id, assigned_to: assignedParticipant.user_id });
  } catch (err) {
    console.error('assignLadder error:', err);
    return res.status(500).json({ error: 'Failed to run ladder assignment' });
  }
};

// GET /tasks/:taskId/ladder/result
export const getLadderResult = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const lr = await prisma.ladderResult.findFirst({ where: { task_id: taskId } });
    if (!lr) return res.status(404).json({ error: 'No ladder result found' });
    return res.json({ participants: lr.participants, ladder_map: lr.ladder_map, result_map: lr.result_map, bottom_result: lr.bottom_result, assigned_to: lr.assigned_to, ladder_id: lr.ladder_id });
  } catch (err) {
    console.error('getLadderResult error:', err);
    return res.status(500).json({ error: 'Failed to get ladder result' });
  }
};