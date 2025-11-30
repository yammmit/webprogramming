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
    const { isDone } = req.body;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { isDone },
    });

    return res.json({ task: updated });
  } catch (err) {
    console.error("updateTask error:", err);
    return res.status(500).json({ error: "Failed to update task" });
  }
};

// 3) 그룹별 Task 조회
export const getGroupTasks = async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);

    const tasks = await prisma.task.findMany({
      where: { group_id: groupId },
      include: {
        assignedTo: true,
        creator: true,
      },
    });

    return res.json({ tasks });
  } catch (err) {
    console.error("getGroupTasks error:", err);
    return res.status(500).json({ error: "Failed to load tasks" });
  }
};

// 4) 오늘 할 일 조회
export const getTodayTasks = async (req, res) => {
  try {
    const uid = req.user.uid;

    // userId 조회
    const user = await prisma.user.findUnique({
      where: { uid },
    });

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: user.id,
        dueDate: {
          gte: start,
          lte: end,
        },
      },
    });

    return res.json({ tasks });
  } catch (err) {
    console.error("getTodayTasks error:", err);
    return res.status(500).json({ error: "Failed to load today's tasks" });
  }
};