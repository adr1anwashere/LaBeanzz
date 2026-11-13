/**
 * Base fetch wrapper for server-component calls that go through the Next proxy.
 * Browser calls use /api/proxy/...; server components can call the backend directly
 * but we route everything through the proxy so we always have auth attached.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API error ${status}`);
  }
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * Base URL for proxy calls.
 * - In the browser: relative path works fine.
 * - In server components: use the full localhost URL.
 */
function proxyBase(): string {
  if (typeof window === "undefined") {
    // Server-side: absolute URL required
    return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  }
  return "";
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: Method;
    body?: unknown;
    token?: string; // bearer token for server-side direct calls
    next?: NextFetchRequestConfig;
  } = {}
): Promise<T> {
  const { method = "GET", body, token, next } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${proxyBase()}/api/proxy/${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    next,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorBody);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
