import { rest } from "msw";
import { db, counters } from "../db";

export const assignmentHandlers = [

  rest.post("/tasks/:taskId/assign", async (req, res, ctx) => {
    const taskId = Number(req.params.taskId);

    return res(
      ctx.status(200),
      ctx.json({
        task_assignment_id: counters.assignmentId++,
        assigned_to: 1,
        status: "assigned",
        created_at: new Date().toISOString(),
      })
    );
  }),

  rest.post("/tasks/:taskId/random-request", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ votes: 3, required: 2 }));
  }),

  rest.post("/tasks/:taskId/random-assign", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        assigned_to: 3,
        task_assignment_id: counters.assignmentId++,
        status: "assigned",
      })
    );
  }),
];
