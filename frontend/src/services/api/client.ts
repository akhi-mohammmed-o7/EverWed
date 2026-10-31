const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public detail?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const body = await response.text();
  let json: any;
  try {
    json = body ? JSON.parse(body) : {};
  } catch {
    throw new APIError(response.status, "INVALID_API_RESPONSE", "The server returned an unreadable response.");
  }

  if (!response.ok || !json.success) {
    const err = json.error;
    throw new APIError(
      response.status,
      err?.code ?? "UNKNOWN",
      err?.message ?? (response.status === 401 ? "Please sign in again." : "Request failed"),
      err?.detail
    );
  }

  return json.data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

