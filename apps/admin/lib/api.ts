import { IS_DEMO } from "./demo";
import { demoRoute, demoRouteSafe } from "./demo-api";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function realFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Imported lazily so the demo/static build never pulls in `next/headers`
  // (which forces the page into dynamic rendering and breaks `output: 'export'`).
  const { cookies } = await import("next/headers");
  const { SESSION_COOKIE } = await import("./auth");

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (IS_DEMO) {
    return demoRoute<T>(path);
  }
  return realFetch<T>(path, init);
}

export async function apiFetchSafe<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  if (IS_DEMO) {
    return demoRouteSafe<T>(path);
  }
  try {
    return await realFetch<T>(path, init);
  } catch {
    return null;
  }
}
