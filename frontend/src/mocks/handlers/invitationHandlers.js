import { rest } from "msw";
import { db, counters } from "../db";

export const invitationHandlers = [

  rest.post("/groups/:groupId/invite", async (req, res, ctx) => {
    const groupId = Number(req.params.groupId);
    const body = await req.json();

    const invitation = {
      invitation_id: counters.invitationId++,
      group_id: groupId,
      user_id: body.user_id,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    db.invitations.push(invitation);

    return res(ctx.status(200), ctx.json(invitation));
  }),

  rest.get("/invitations", (req, res, ctx) => {
    const list = db.invitations.map((i) => ({
      ...i,
      group_name: db.groups.find((g) => g.group_id === i.group_id)?.group_name ?? "",
      invited_by: {
        user_id: 1,
        user_name: "홍길동",
      },
    }));

    return res(ctx.status(200), ctx.json(list));
  }),

  rest.post("/invitations/:invitationId/accept", (req, res, ctx) => {
    const id = Number(req.params.invitationId);

    return res(ctx.status(200), ctx.json({ message: "accepted" }));
  }),

  rest.delete("/invitations/:invitationId", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: "deleted" }));
  }),
];
