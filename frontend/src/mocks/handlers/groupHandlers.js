import { rest } from "msw";
import { db, counters } from "../db";

export const groupHandlers = [

  // 그룹 생성
  rest.post("/groups", async (req, res, ctx) => {
    const body = await req.json();

    const newGroup = {
      group_id: counters.groupId++,
      group_name: body.group_name,
      group_created_at: new Date().toISOString(),
      members: [],
    };

    db.groups.push(newGroup);

    return res(ctx.status(200), ctx.json(newGroup));
  }),

  // 내 그룹 목록
  rest.get("/groups", (req, res, ctx) => {
    const list = db.groups.map((g) => ({
      group_id: g.group_id,
      group_name: g.group_name,
    }));

    return res(ctx.status(200), ctx.json(list));
  }),

  // 그룹 상세
  rest.get("/groups/:groupId", (req, res, ctx) => {
    const groupId = Number(req.params.groupId);
    const group = db.groups.find((g) => g.group_id === groupId);

    if (!group) return res(ctx.status(404), ctx.json({ message: "group_not_found" }));

    return res(ctx.status(200), ctx.json(group));
  }),

  // 그룹 삭제
  rest.delete("/groups/:groupId", (req, res, ctx) => {
    const groupId = Number(req.params.groupId);

    db.groups = db.groups.filter((g) => g.group_id !== groupId);

    return res(ctx.status(200), ctx.json({ message: "group_deleted" }));
  }),
];
