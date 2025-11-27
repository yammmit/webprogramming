import { SignJWT, jwtVerify } from "jose";

// JWT Secret
export const JWT_SECRET = new TextEncoder().encode("MOCK_SECRET_KEY_123");

// JWT 생성 (로그인 시)
export async function createToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(JWT_SECRET);
}

// JWT 검증
export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}
