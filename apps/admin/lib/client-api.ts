import { IS_DEMO } from "./demo";

export class DemoReadOnlyError extends Error {
  constructor() {
    super("Demo mode — this action is read-only in the showcase build.");
    this.name = "DemoReadOnlyError";
  }
}

function isMutation(method: string | undefined): boolean {
  const m = (method ?? "GET").toUpperCase();
  return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
}

async function demoHandle<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  if (isMutation(init.method)) {
    throw new DemoReadOnlyError();
  }
  const { demoRoute } = await import("./demo-api");
  return demoRoute<T>(path);
}

export async function clientApi<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (IS_DEMO) {
    return demoHandle<T>(path, init);
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      message = JSON.parse(text)?.message ?? text;
    } catch {
      /* keep text */
    }
    throw new Error(
      Array.isArray(message) ? message.join(", ") : String(message),
    );
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return (await res.text()) as unknown as T;
}

export async function logout() {
  if (IS_DEMO) {
    window.location.href = "/login";
    return;
  }
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "/login";
}
