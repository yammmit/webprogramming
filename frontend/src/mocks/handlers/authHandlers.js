import { rest } from "msw";
import { db, counters } from "../db";
import { createToken, verifyToken } from "../utils/jwt";

// 회원가입
export const authHandlers = [
  rest.post("/auth/signup", async (req, res, ctx) => {
    const body = await req.json();

    const exists = db.users.find((u) => u.email === body.email);
    if (exists) {
      return res(ctx.status(409), ctx.json({ message: "email_already_exists" }));
    }

    const newUser = {
      user_id: counters.userId++,
      email: body.email,
      password: body.password,
      name: body.name,
    };

    db.users.push(newUser);

    return res(ctx.status(200), ctx.json({ user_id: newUser.user_id, message: "signup_success" }));
  }),

  // 로그인
  rest.post("/auth/login", async (req, res, ctx) => {
    const body = await req.json();

    const user = db.users.find((u) => u.email === body.email && u.password === body.password);

    if (!user) {
      return res(ctx.status(401), ctx.json({ message: "invalid_credentials" }));
    }

    const token = await createToken({
      user_id: user.user_id,
      user_name: user.name,
      user_email: user.email,
    });

    return res(
      ctx.status(200),
      ctx.json({
        token,
        user: {
          user_id: user.user_id,
          user_name: user.name,
          user_email: user.email,
        },
      })
    );
  }),

  // 내 정보 조회
  rest.get("/auth/me", async (req, res, ctx) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return res(ctx.status(401), ctx.json({ message: "no_token" }));

    try {
      const token = authHeader.replace("Bearer ", "");
      const decoded = await verifyToken(token);

      return res(
        ctx.status(200),
        ctx.json({
          user_id: decoded.user_id,
          user_name: decoded.user_name,
          user_email: decoded.user_email,
        })
      );
    } catch (e) {
      return res(ctx.status(401), ctx.json({ message: "invalid_or_expired_token" }));
    }
  }),
];
