import { rest } from "msw";
import { db } from "../db";

export const userHandlers = [
  rest.get("/users/search", (req, res, ctx) => {
    const query = req.url.searchParams.get("query")?.toLowerCase() || "";

    const users = db.users.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        u.name.toLowerCase().includes(query)
    );

    return res(ctx.status(200), ctx.json({ users }));
  }),
];
