import { rest } from "msw";
import { db, counters } from "../db";

export const evaluationHandlers = [

  rest.post("/tasks/:taskId/evaluate", async (req, res, ctx) => {
    const body = await req.json();

    const evaluation = {
      task_evaluation_id: counters.evaluationId++,
      ...body,
      created_at: new Date().toISOString(),
    };

    db.evaluations.push(evaluation);

    return res(ctx.status(200), ctx.json(evaluation));
  }),

  rest.get("/tasks/:taskId/evaluations", (req, res, ctx) => {
    const list = db.evaluations;
    return res(ctx.status(200), ctx.json(list));
  }),
];
