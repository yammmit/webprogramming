import { rest } from "msw";
import { db, counters } from "../db";

export const taskHandlers = [

  rest.post("/tasks", async (req, res, ctx) => {
    const body = await req.json();

    const newTask = {
      task_id: counters.taskId++,
      ...body,
      status: "assigned",
    };

    db.tasks.push(newTask);

    return res(ctx.status(200), ctx.json({ task_id: newTask.task_id }));
  }),

  rest.get("/groups/:groupId/tasks", (req, res, ctx) => {
    const groupId = Number(req.params.groupId);

    const list = db.tasks.filter((t) => t.group_id === groupId);

    return res(ctx.status(200), ctx.json(list));
  }),

  rest.get("/tasks/:taskId", (req, res, ctx) => {
    const id = Number(req.params.taskId);
    const task = db.tasks.find((t) => t.task_id === id);

    if (!task) return res(ctx.status(404), ctx.json({ message: "task_not_found" }));

    return res(ctx.status(200), ctx.json(task));
  }),
];
