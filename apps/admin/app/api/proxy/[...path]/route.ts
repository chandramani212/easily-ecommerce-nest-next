import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "../../../../lib/auth";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const target = `${API_URL}/${path.join("/")}${url.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("Accept", accept);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const apiRes = await fetch(target, {
    method: request.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
    cache: "no-store",
  });

  const resContentType = apiRes.headers.get("content-type") ?? "";
  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", resContentType);
  const disposition = apiRes.headers.get("content-disposition");
  if (disposition) responseHeaders.set("Content-Disposition", disposition);

  const buf = await apiRes.arrayBuffer();
  return new NextResponse(buf, {
    status: apiRes.status,
    headers: responseHeaders,
  });
}

export async function GET(request: Request, ctx: Ctx) {
  return forward(request, ctx);
}
export async function POST(request: Request, ctx: Ctx) {
  return forward(request, ctx);
}
export async function PUT(request: Request, ctx: Ctx) {
  return forward(request, ctx);
}
export async function PATCH(request: Request, ctx: Ctx) {
  return forward(request, ctx);
}
export async function DELETE(request: Request, ctx: Ctx) {
  return forward(request, ctx);
}
