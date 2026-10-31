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
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await response.json();

  if (!response.ok || !json.success) {
    const err = json.error;
    throw new APIError(
      response.status,
      err?.code ?? "UNKNOWN",
      err?.message ?? "Request failed",
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

