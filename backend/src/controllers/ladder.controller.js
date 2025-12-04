import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/* ===========================================================
   사다리 구조 생성 유틸 (ladder_map, result_map)
=========================================================== */
function generateLadder(participants, rows = 9, seed = 1) {
  const columns = participants.length;

  // Seeded RNG
  let t = seed >>> 0;
  function rand() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), r | 61)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }

  const connections = Array.from({ length: rows }).map(() =>
    Array(columns - 1).fill(false)
  );
  const ladder_map = [];

  // 가로줄 생성
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

  // result_map 계산
  const result_map = {};
  for (let start = 1; start <= columns; start++) {
    let cur = start - 1;
    for (let r = 0; r < rows; r++) {
      if (connections[r][cur]) cur++;
      else if (cur - 1 >= 0 && connections[r][cur - 1]) cur--;
    }
    result_map[start] = cur + 1;
  }

  return { ladder_map, result_map };
}

/* ===========================================================
   1) 투표 API
=========================================================== */
export const voteForLadder = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const taskId = Number(req.params.taskId);
    const userId = Number(req.user.sub || req.user.user_id || req.user.id);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const members = await prisma.groupMember.findMany({
      where: { group_id: task.group_id },
      select: { user_id: true }
    });

    const isMember = members.some(m => Number(m.user_id) === userId);
    if (!isMember) return res.status(403).json({ error: 'Not a group member' });

    await prisma.ladderVote.upsert({
      where: { task_id_user_id: { task_id: taskId, user_id: userId } },
      update: { vote: true, created_at: new Date() },
      create: { task_id: taskId, user_id: userId, vote: true }
    });

    const votes = await prisma.ladderVote.count({ where: { task_id: taskId, vote: true } });
    const required = Math.ceil(members.length / 2);
    const majority = votes >= required;

    return res.json({ votes, total_members: members.length, required, majority });
  } catch (err) {
    console.error('voteForLadder error:', err);
    return res.status(500).json({ error: 'Failed to register vote' });
  }
};

/* ===========================================================
   2) 투표 현황 조회 API
=========================================================== */
export const getLadderStatus = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);

    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const members = await prisma.groupMember.findMany({ where: { group_id: task.group_id } });

    const votes = await prisma.ladderVote.count({ where: { task_id: taskId, vote: true } });

    const required = Math.ceil(members.length / 2);
    const majority = votes >= required;

    // If a LadderResult already exists, include assignment info for frontend convenience
    const existing = await prisma.ladderResult.findFirst({ where: { task_id: taskId } });
    let assigned = null;
    if (existing) {
      assigned = existing.assigned_to || null;
    }

    return res.json({ total_members: members.length, votes, required, majority, assigned });
  } catch (err) {
    console.error('getLadderStatus error:', err);
    return res.status(500).json({ error: 'Failed to get ladder status' });
  }
};

/* ===========================================================
   3) 사다리 실행 API
   - ensure participants user_name present
   - ladder_map/result_map/bottom_result always non-null
=========================================================== */
export const assignLadder = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);

    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // If result already exists, return stored structured response
    const existing = await prisma.ladderResult.findFirst({ where: { task_id: taskId } });
    if (existing) {
      // try to return assigned_to as object with name
      let assignedObj = { user_id: existing.assigned_to };
      try {
        const parts = Array.isArray(existing.participants) ? existing.participants : JSON.parse(existing.participants || '[]');
        const found = parts.find(p => Number(p.user_id) === Number(existing.assigned_to));
        if (found) assignedObj = { user_id: found.user_id, name: found.user_name ?? found.name };
      } catch (e) {}

      return res.json({ ladder_id: existing.ladder_id, assigned_to: assignedObj });
    }

    // load members
    const memberList = await prisma.groupMember.findMany({ where: { group_id: task.group_id }, include: { user: true }, orderBy: { joined_at: 'asc' } });

    if (!memberList || memberList.length < 2) {
      return res.status(400).json({ error: 'At least 2 members required' });
    }

    // participants must always include user_name
    const participants = memberList.map((m, idx) => ({
      user_id: m.user.user_id,
      user_name: m.user.user_name ?? m.user.name ?? `참여자_${idx + 1}`
    }));

    // vote majority check
    const votes = await prisma.ladderVote.count({ where: { task_id: taskId, vote: true } });
    const required = Math.ceil(memberList.length / 2);
    if (votes < required) {
      return res.status(400).json({ error: 'Not enough votes', votes, required, total_members: memberList.length });
    }

    // generate ladder deterministically using seed (taskId)
    const rows = 7 + Math.floor(Math.abs(Number(taskId)) % 6); // 7..12 deterministically
    const seed = Number(taskId) || 1;
    const { ladder_map, result_map } = generateLadder(participants, rows, seed);

    // ensure ladder_map/result_map are valid JSON structures
    const safe_ladder_map = Array.isArray(ladder_map) ? ladder_map : [];
    const safe_result_map = (result_map && typeof result_map === 'object') ? result_map : {};

    // determine winner position deterministically from seed to be reproducible
    const winnerPos = Number(seed) % participants.length; // 0-based deterministic
    const bottom_result = Array(participants.length).fill('꽝');
    bottom_result[winnerPos] = '당첨';

    // find assigned participant by inverting result_map
    let assigned = participants[0];
    const targetCol = winnerPos + 1;
    for (let s = 1; s <= participants.length; s++) {
      const endCol = Number(safe_result_map[String(s)] || safe_result_map[s]);
      if (endCol === targetCol) {
        assigned = participants[s - 1];
        break;
      }
    }

    // persist LadderResult
    const lr = await prisma.ladderResult.create({
      data: {
        task_id: taskId,
        group_id: task.group_id,
        participants: participants,
        ladder_map: safe_ladder_map,
        result_map: safe_result_map,
        bottom_result: bottom_result,
        assigned_to: assigned.user_id
      }
    });

    // create TaskAssignment record
    await prisma.taskAssignment.create({ data: { task_id: taskId, assigned_to: assigned.user_id, assignment_type: 'ladder', status: 'assigned' } });

    return res.json({ ladder_id: lr.ladder_id, assigned_to: { user_id: assigned.user_id, name: assigned.user_name } });
  } catch (err) {
    console.error('assignLadder error:', err);
    return res.status(500).json({ error: 'Failed to run ladder assignment' });
  }
};

/* ===========================================================
   4) 사다리 결과 조회 API
=========================================================== */
export const getLadderResult = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const lr = await prisma.ladderResult.findFirst({ where: { task_id: taskId } });
    if (!lr) return res.status(404).json({ error: 'No ladder result found' });

    // build assigned_to object with name if possible
    let assignedObj = { user_id: lr.assigned_to };
    try {
      const parts = Array.isArray(lr.participants) ? lr.participants : JSON.parse(lr.participants || '[]');
      const found = parts.find(p => Number(p.user_id) === Number(lr.assigned_to));
      if (found) assignedObj = { user_id: found.user_id, name: found.user_name ?? found.name };
    } catch (e) {}

    return res.json({ ladder_id: lr.ladder_id, participants: lr.participants, ladder_map: lr.ladder_map, result_map: lr.result_map, bottom_result: lr.bottom_result, assigned_to: assignedObj, created_at: lr.created_at });
  } catch (err) {
    console.error('getLadderResult error:', err);
    return res.status(500).json({ error: 'Failed to get ladder result' });
  }
};
