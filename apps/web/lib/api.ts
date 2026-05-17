const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...(init.body && !(init.headers as Record<string, string>)?.["Content-Type"]
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function apiFetchSafe<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, init);
  } catch {
    return null;
  }
}

export { API_URL };
