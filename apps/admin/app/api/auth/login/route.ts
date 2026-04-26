import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "../../../../lib/auth";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 },
    );
  }

  const apiRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  const data = await apiRes.json().catch(() => ({}));

  if (!apiRes.ok) {
    return NextResponse.json(
      { message: data?.message || "Invalid credentials" },
      { status: apiRes.status },
    );
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: data.accessToken as string,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
