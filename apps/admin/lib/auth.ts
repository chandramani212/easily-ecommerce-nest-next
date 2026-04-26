import { jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "admin_session";

export interface AdminSessionPayload extends JWTPayload {
  sub: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  name: string;
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<AdminSessionPayload | null> {
  try {
    const encoder = new TextEncoder();
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    return payload as AdminSessionPayload;
  } catch {
    return null;
  }
}
