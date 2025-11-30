import jwt from "jsonwebtoken";

const jwtAuth = (req, res, next) => {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret");
    req.user = payload;
    return next();
  } catch (err) {
    console.error("JWT verify failed:", err.message || err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

export default jwtAuth;
