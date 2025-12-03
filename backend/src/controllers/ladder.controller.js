import { prisma } from '../../prismaClient';

// POST /tasks/:taskId/ladder/vote
export const voteForLadder = async (req, res) => {
  try {
    if (!prisma.ladderVote) return res.status(500).json({ error: 'LadderVote model not available. Run prisma migrate.' });

    const taskId = Number(req.params.taskId);
    const { vote } = req.body ?? { vote: true };
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });

    const uid = firebaseUser.uid;
    const user = await prisma.user.findUnique({ where: { uid } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userId = Number(user.user_id);

    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const groupId = task.group_id;

    // members
    let members = [];
    try { members = await prisma.groupMember.findMany({ where: { group_id: groupId }, select: { user_id: true } }); }
    catch (e) { try { members = await prisma.groupMembership.findMany({ where: { group_id: groupId }, select: { user_id: true } }); } catch (e2) { const g = await prisma.group.findUnique({ where: { group_id: groupId }, include: { members: true } }); members = (g?.members || []).map(m=>({ user_id: m.user_id })); } }
    const totalMembers = (members || []).length;
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

    return res.json({ votes, required, majority });
  } catch (err) {
    console.error('voteForLadder error:', err);
    return res.status(500).json({ error: 'Failed to register vote' });
  }
};

// GET /tasks/:taskId/ladder/status
export const getLadderStatus = async (req, res) => {
  try {
    if (!prisma.ladderVote) return res.status(500).json({ error: 'LadderVote model not available. Run prisma migrate.' });
    const taskId = Number(req.params.taskId);
    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const groupId = task.group_id;

    let members = [];
    try { members = await prisma.groupMember.findMany({ where: { group_id: groupId }, select: { user_id: true } }); }
    catch (e) { try { members = await prisma.groupMembership.findMany({ where: { group_id: groupId }, select: { user_id: true } }); } catch (e2) { const g = await prisma.group.findUnique({ where: { group_id: groupId }, include: { members: true } }); members = (g?.members || []).map(m=>({ user_id: m.user_id })); } }
    const totalMembers = (members || []).length;
    const votes = await prisma.ladderVote.count({ where: { task_id: taskId, vote: true } });
    const required = Math.ceil(totalMembers / 2);
    const majority = votes >= required;

    return res.json({ total_members: totalMembers, votes, required, majority });
  } catch (err) {
    console.error('getLadderStatus error:', err);
    return res.status(500).json({ error: 'Failed to get ladder status' });
  }
};

// POST /tasks/:taskId/ladder/assign
export const assignLadder = async (req, res) => {
  try {
    if (!prisma.ladderVote) return res.status(500).json({ error: 'LadderVote model not available. Run prisma migrate.' });
    const taskId = Number(req.params.taskId);
    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // check existing assignment
    const existingAssigned = await prisma.taskAssignment.findFirst({ where: { task_id: taskId, status: 'assigned' } });
    if (existingAssigned) return res.status(400).json({ error: '이미 배정되었습니다.' });

    const groupId = task.group_id;
    let members = [];
    try { members = await prisma.groupMember.findMany({ where: { group_id: groupId }, include: { user: true } }); }
    catch (e) { try { members = await prisma.groupMembership.findMany({ where: { group_id: groupId }, include: { user: true } }); } catch (e2) { const g = await prisma.group.findUnique({ where: { group_id: groupId }, include: { members: { include: { user: true } } } }); members = (g?.members || []).map(m=>({ user_id: m.user_id, user: m.user || null })); } }
    const totalMembers = (members || []).length;
    if (totalMembers === 0) return res.status(400).json({ error: 'No members in group' });

    const votes = await prisma.ladderVote.count({ where: { task_id: taskId, vote: true } });
    const required = Math.ceil(totalMembers / 2);
    if (votes < required) return res.status(400).json({ error: '과반수 찬성이 필요합니다.' });

    const randomIndex = Math.floor(Math.random() * members.length);
    const winner = members[randomIndex];
    const winnerUserId = winner.user_id ?? winner.user?.user_id ?? winner.user?.id ?? null;
    if (!winnerUserId) return res.status(500).json({ error: 'Failed to determine winner id' });

    const assignment = await prisma.taskAssignment.create({ data: { task_id: taskId, assigned_to: winnerUserId, assignment_type: 'random', status: 'assigned' } });

    try { await prisma.task.update({ where: { task_id: taskId }, data: { status: 'assigned' } }); } catch (e) {}

    const winnerUser = winner.user || (await prisma.user.findUnique({ where: { user_id: winnerUserId } }));
    return res.json({ task_assignment_id: assignment.task_assignment_id, assigned_to: { user_id: winnerUserId, user_name: winnerUser?.user_name || winnerUser?.name || null }, status: 'assigned' });
  } catch (err) {
    console.error('assignLadder error:', err);
    return res.status(500).json({ error: 'Failed to run ladder assignment' });
  }
};