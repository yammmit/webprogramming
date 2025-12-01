import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 1) Task 생성
export const createTask = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const creatorId = Number(req.user?.sub);
    if (!creatorId) return res.status(401).json({ error: "Unauthorized" });

    const { title, description, difficulty, frequency_type, weekday_mask } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: "Title required" });

    const group = await prisma.group.findUnique({ where: { group_id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const task = await prisma.task.create({
      data: {
        title: String(title).trim(),
        description: description ?? null,
        difficulty: Number(difficulty) || 1,
        frequency_type: frequency_type ?? null,
        weekday_mask: weekday_mask ?? null,
        created_at: new Date(),
        group_id: groupId,
        // creator relation omitted: some Prisma schemas use a scalar field or different relation name
        // If you have a creator_id scalar field, change to creator_id: creatorId
      },
    });

    return res.status(201).json({ task });
  } catch (err) {
    console.error("createTask error:", err);
    return res.status(500).json({ error: "Failed to create task" });
  }
};

// 2) Task 상태 업데이트 (isDone)
export const updateTask = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const { isDone, status } = req.body;

    const data = {};
    if (typeof isDone !== 'undefined') data.isDone = isDone;
    if (typeof status !== 'undefined') data.status = status;

    const updated = await prisma.task.update({
      where: { task_id: taskId },
      data,
    });

    return res.json(updated);
  } catch (err) {
    console.error('updateTask error:', err);
    return res.status(500).json({ error: 'Failed to update task' });
  }
};

// 3) 그룹별 Task 조회
export const getGroupTasks = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);

    // fetch tasks with their assignments (latest first)
    const tasksRaw = await prisma.task.findMany({
      where: { group_id: groupId },
      include: { assignments: { orderBy: { created_at: 'desc' }, include: { assignedTo: true } } },
    });

    // normalize to include assigned_to (from latest assignment) and status
    const tasks = tasksRaw.map((t) => {
      const latest = (t.assignments && t.assignments.length > 0) ? t.assignments[0] : null;
      return {
        task_id: t.task_id,
        group_id: t.group_id,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty,
        frequency_type: t.frequency_type,
        weekday_mask: t.weekday_mask,
        created_at: t.created_at,
        // normalize
        assigned_to: latest ? latest.assigned_to : null,
        status: latest ? latest.status : 'unassigned',
        assignments: t.assignments || [],
      };
    });

    return res.json(tasks);
  } catch (err) {
    console.error('getGroupTasks error:', err);
    return res.status(500).json({ error: 'Failed to load tasks' });
  }
};

// Get single task by id
export const getTaskById = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const t = await prisma.task.findUnique({ where: { task_id: taskId }, include: { assignments: { orderBy: { created_at: 'desc' }, include: { assignedTo: true } } } });
    if (!t) return res.status(404).json({ error: 'Task not found' });
    const latest = (t.assignments && t.assignments.length > 0) ? t.assignments[0] : null;
    const task = {
      task_id: t.task_id,
      group_id: t.group_id,
      title: t.title,
      description: t.description,
      difficulty: t.difficulty,
      frequency_type: t.frequency_type,
      weekday_mask: t.weekday_mask,
      created_at: t.created_at,
      assigned_to: latest ? latest.assigned_to : null,
      status: latest ? latest.status : 'unassigned',
      assignments: t.assignments || [],
    };

    console.log('getTaskById - difficulty:', t.difficulty, 'typeof:', typeof t.difficulty, 'task_id:', t.task_id);

    return res.json({ task });
  } catch (err) {
    console.error('getTaskById error:', err);
    return res.status(500).json({ error: 'Failed to load task' });
  }
};

// Assign a task to a user (self-request or admin assign)
export const assignTask = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const { user_id: bodyUserId, assignment_type } = req.body || {};
    const actingUser = Number(req.user?.sub || req.user?.user_id || req.user?.id || null);

    // default to logged-in user if user_id not provided
    const userIdToAssign = Number(typeof bodyUserId !== 'undefined' && bodyUserId !== null ? bodyUserId : actingUser);
    if (!userIdToAssign) return res.status(401).json({ error: 'Unauthorized' });

    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // check for existing assignments
    const existingCount = await prisma.taskAssignment.count({ where: { task_id: taskId } });
    if (existingCount > 0) return res.status(400).json({ error: 'Task already assigned' });

    // create assignment using schema fields
    const assignment = await prisma.taskAssignment.create({
      data: {
        task_id: taskId,
        assigned_to: userIdToAssign,
        assignment_type: assignment_type || 'self-request',
        status: 'assigned',
      },
    });

    // return normalized response matching API contract
    return res.status(201).json({
      task_assignment_id: assignment.task_assignment_id,
      assigned_to: assignment.assigned_to,
      status: assignment.status,
      created_at: assignment.created_at,
    });
  } catch (err) {
    console.error('assignTask error:', err);
    return res.status(500).json({ error: 'Failed to assign task' });
  }
};

// Complete a task assignment (create TaskCompletion and mark assignment completed)
export const completeTask = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const currentUserId = Number(req.user?.sub || req.user?.user_id || req.user?.id || null);
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

    // find latest assignment for the task
    const assignment = await prisma.taskAssignment.findFirst({ where: { task_id: taskId }, orderBy: { created_at: 'desc' } });
    if (!assignment) return res.status(404).json({ error: 'No assignment found for task' });
    if (assignment.status === 'completed') return res.status(400).json({ error: 'Assignment already completed' });

    // create completion record
    const completion = await prisma.taskCompletion.create({
      data: {
        assignment_id: assignment.task_assignment_id,
        completed_by: currentUserId,
      },
    });

    // mark assignment as completed
    await prisma.taskAssignment.update({ where: { task_assignment_id: assignment.task_assignment_id }, data: { status: 'completed' } });

    // try to update task status if schema has it
    try {
      await prisma.task.update({ where: { task_id: taskId }, data: { status: 'completed' } });
    } catch (e) {
      // ignore if field doesn't exist
    }

    return res.status(201).json({ completion_id: completion.task_completion_id, assignment_id: assignment.task_assignment_id, completed_at: completion.completed_at });
  } catch (err) {
    console.error('completeTask error:', err);
    return res.status(500).json({ error: 'Failed to complete task' });
  }
};

// Get evaluations for a task
export const getTaskEvaluations = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    // find assignments for this task
    const assignments = await prisma.taskAssignment.findMany({ where: { task_id: taskId } });
    const assignmentIds = assignments.map(a => a.task_assignment_id);

    if (assignmentIds.length === 0) return res.json([]);

    const evaluations = await prisma.taskEvaluation.findMany({
      where: { assignment_id: { in: assignmentIds } },
      include: { evaluator: true },
      orderBy: { created_at: 'desc' },
    });

    // normalize response and hide evaluator info if anonymous
    const out = evaluations.map(ev => ({
      task_evaluation_id: ev.task_evaluation_id,
      assignment_id: ev.assignment_id,
      evaluator_id: ev.is_anonymous ? null : ev.evaluator_id,
      evaluator_name: ev.is_anonymous ? null : (ev.evaluator?.user_name || null),
      rating: ev.rating,
      comment: ev.comment,
      is_anonymous: ev.is_anonymous,
      created_at: ev.created_at,
    }));

    return res.json(out);
  } catch (err) {
    console.error('getTaskEvaluations error:', err);
    return res.status(500).json({ error: 'Failed to load evaluations' });
  }
};

// Create evaluation for a task (use latest assignment if assignment_id not provided)
export const createTaskEvaluation = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const { rating, comment, is_anonymous, assignment_id: bodyAssignmentId } = req.body || {};
    const evaluatorId = Number(req.user?.sub || req.user?.user_id || req.user?.id || null);
    if (!evaluatorId) return res.status(401).json({ error: 'Unauthorized' });
    if (!rating) return res.status(400).json({ error: 'rating required' });
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });

    // determine assignment id
    let assignmentId = bodyAssignmentId ? Number(bodyAssignmentId) : null;
    if (!assignmentId) {
      const latest = await prisma.taskAssignment.findFirst({ where: { task_id: taskId }, orderBy: { created_at: 'desc' } });
      if (!latest) return res.status(404).json({ error: 'No assignment found for task' });
      assignmentId = latest.task_assignment_id;
    }

    // check uniqueness (composite unique)
    const exists = await prisma.taskEvaluation.findUnique({ where: { assignment_id_evaluator_id: { assignment_id: assignmentId, evaluator_id: evaluatorId } } }).catch(() => null);
    if (exists) return res.status(400).json({ error: 'Already evaluated' });

    // create evaluation
    try {
      const ev = await prisma.taskEvaluation.create({
        data: {
          assignment_id: assignmentId,
          evaluator_id: evaluatorId,
          rating: r,
          comment: comment ?? null,
          is_anonymous: Boolean(is_anonymous),
        },
      });

      return res.status(201).json({ task_evaluation_id: ev.task_evaluation_id, assignment_id: ev.assignment_id, evaluator_id: ev.evaluator_id, rating: ev.rating, comment: ev.comment, is_anonymous: ev.is_anonymous, created_at: ev.created_at });
    } catch (e) {
      // handle unique constraint from Prisma client
      if (e?.code === 'P2002') return res.status(400).json({ error: 'Already evaluated' });
      throw e;
    }
  } catch (err) {
    console.error('createTaskEvaluation error:', err);
    return res.status(500).json({ error: 'Failed to create evaluation' });
  }
};

// Get completion history for a task (task completions across assignments)
export const getTaskHistory = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);

    // find completions for assignments that belong to this task
    const completions = await prisma.taskCompletion.findMany({
      where: { assignment: { task: { task_id: taskId } } },
      include: {
        assignment: { include: { task: true } },
        completedBy: true,
      },
      orderBy: { completed_at: 'desc' },
    });

    const out = completions.map((c) => ({
      task_completion_id: c.task_completion_id,
      assignment_id: c.assignment_id,
      task_id: c.assignment?.task?.task_id || taskId,
      difficulty: c.assignment?.task?.difficulty ?? null,
      completed_at: c.completed_at,
      completed_by: c.completed_by,
      user_name: c.completedBy?.user_name || null,
      task_title: c.assignment?.task?.title || null,
    }));

    return res.json(out);
  } catch (err) {
    console.error('getTaskHistory error:', err);
    return res.status(500).json({ error: 'Failed to load task history' });
  }
};

// Get group-wide completion history (latest N)
export const getGroupHistory = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const limit = Number(req.query.limit || 5);

    const completions = await prisma.taskCompletion.findMany({
      where: { assignment: { task: { group_id: groupId } } },
      include: {
        assignment: { include: { task: true } },
        completedBy: true,
      },
      orderBy: { completed_at: 'desc' },
      take: limit,
    });

    const out = completions.map((c) => ({
      task_completion_id: c.task_completion_id,
      assignment_id: c.assignment_id,
      task_id: c.assignment?.task?.task_id || null,
      task_title: c.assignment?.task?.title || null,
      difficulty: c.assignment?.task?.difficulty ?? null,
      completed_at: c.completed_at,
      completed_by: c.completed_by,
      user_name: c.completedBy?.user_name || null,
    }));

    return res.json(out);
  } catch (err) {
    console.error('getGroupHistory error:', err);
    return res.status(500).json({ error: 'Failed to load group history' });
  }
};