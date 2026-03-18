export type Product = {
  _id: string;
  supplier_id: string;
  title?: string;
  description?: string;
  supplier_sku?: string;
  approval_status: string;
  extraction_confidence: number;
  raw_attributes: Record<string, any>;
  mapped_attributes: Record<string, string>;
  extracted_attributes: Record<string, string>;
};

export type ImportItem = {
  _id: string;
  supplier_id: string;
  source_type: string;
  source_ref: string;
  total_rows: number;
  imported_at: string;
  status?: string;
  error?: string;
};

export type ImportCreateResponse = {
  import_id: string;
  supplier_id: string;
  source_type: string;
  source_ref: string;
  total_rows: number;
  created_at: string;
};

export type Supplier = {
  _id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
};


export type AttributeRule = {
  _id: string;
  master_attribute: string;
  allowed_values: string[];
  rules?: string;
  active?: boolean;
};

export type AttributeSession = {
  _id?: string;
  selected_attributes: string[];
  available_attributes: string[];
  session_title?: string | null;
  is_active?: boolean;
  updated_at?: string;
};

export type SyncItem = {
  _id: string;
  product_id: string;
  supplier_id: string;
  status: string;
  error?: string;
  created_at: string;
  updated_at: string;
};

export type ApprovalItem = {
  _id: string;
  product_id: string;
  status: string;
  reviewer?: string;
  notes?: string;
  updated_at: string;
};

function normalizeApiBase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withoutTrailingSlashes = trimmed.replace(/\/+$/, "");
  // Common misconfig: setting VITE_API_BASE to ".../api". Our code already prefixes "/api/...".
  if (withoutTrailingSlashes.endsWith("/api")) {
    return withoutTrailingSlashes.slice(0, -4);
  }
  return withoutTrailingSlashes;
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function getDefaultApiBase(): string {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:8000";
  }
  return isLocalHostname(window.location.hostname) ? "http://127.0.0.1:8000" : "";
}

const ENV_API_BASE = normalizeApiBase((import.meta.env.VITE_API_BASE as string | undefined) ?? "");

export const API_BASE = ENV_API_BASE || getDefaultApiBase();

function getApiBase(): string {
  const base = ENV_API_BASE || getDefaultApiBase();
  if (!base) {
    throw new Error("Missing VITE_API_BASE. Set it to your backend URL and redeploy.");
  }

  const isBrowser = typeof window !== "undefined";
  const isRemoteFrontend = isBrowser && !isLocalHostname(window.location.hostname);
  const isLocalApi = base.includes("127.0.0.1") || base.includes("localhost");

  if (isRemoteFrontend && isLocalApi) {
    throw new Error(
      `Frontend is configured to call a local backend (${base}). Set VITE_API_BASE to your backend URL and redeploy.`,
    );
  }

  return base;
}

function apiUrl(path: string): string {
  return getApiBase() + path;
}

const DEFAULT_TIMEOUT_MS = 15000;
function authHeaders(): Record<string, string> {
  const key = localStorage.getItem("api_key");
  return key ? { "X-API-Key": key } : {};
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function apiFetch(input: RequestInfo, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  try {
    return await fetchWithTimeout(input, init, timeoutMs);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Request timed out after ${Math.ceil(timeoutMs / 1000)}s`);
    }
    throw err;
  }
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const text = await res.text();
  if (!text) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(text);
    return parsed?.detail || parsed?.message || fallback;
  } catch {
    return text;
  }
}

async function requestJson<T>(input: RequestInfo, init: RequestInit = {}, fallback = "Request failed", timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const res = await apiFetch(input, init, timeoutMs);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, fallback));
  }
  return res.json();
}

async function request(input: RequestInfo, init: RequestInit = {}, fallback = "Request failed", timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const res = await apiFetch(input, init, timeoutMs);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, fallback));
  }
  return res;
}
export async function fetchProducts(params?: { supplierId?: string; status?: string }): Promise<Product[]> {
  const url = new URL(apiUrl("/api/products"));
  if (params?.supplierId) url.searchParams.set("supplier_id", params.supplierId);
  if (params?.status) url.searchParams.set("status", params.status);
  return requestJson<Product[]>(url.toString(), { headers: authHeaders() }, "Failed to fetch products");
}

export async function fetchImports(params?: { supplierId?: string }): Promise<ImportItem[]> {
  const url = new URL(apiUrl("/api/imports"));
  if (params?.supplierId) url.searchParams.set("supplier_id", params.supplierId);
  return requestJson<ImportItem[]>(url.toString(), { headers: authHeaders() }, "Failed to fetch imports");
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  return requestJson<Supplier[]>(apiUrl("/api/suppliers"), { headers: authHeaders() }, "Failed to fetch suppliers");
}

export async function createSupplier(payload: { name: string; code: string }): Promise<Supplier> {
  return requestJson<Supplier>(apiUrl("/api/suppliers"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }, "Failed to create supplier");
}

export async function updateSupplier(id: string, payload: { name?: string; code?: string; status?: string }): Promise<Supplier> {
  return requestJson<Supplier>(apiUrl(`/api/suppliers/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }, "Failed to update supplier");
}

export async function deleteSupplier(id: string) {
  return requestJson(apiUrl(`/api/suppliers/${id}`), {
    method: "DELETE",
    headers: { ...authHeaders() },
  }, "Failed to delete supplier");
}


export async function fetchAttributes(): Promise<AttributeRule[]> {
  return requestJson<AttributeRule[]>(apiUrl("/api/attributes"), { headers: authHeaders() }, "Failed to fetch attributes");
}

export async function upsertAttribute(payload: { master_attribute: string; allowed_values: string[]; rules?: string }) {
  return requestJson(apiUrl("/api/attributes"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }, "Failed to upsert attribute");
}

export async function fetchAttributeSession(): Promise<AttributeSession> {
  return requestJson<AttributeSession>(apiUrl("/api/attributes/session"), { headers: authHeaders() }, "Failed to fetch attribute session");
}

export async function fetchAttributeSessions(): Promise<AttributeSession[]> {
  return requestJson<AttributeSession[]>(apiUrl("/api/attributes/sessions"), { headers: authHeaders() }, "Failed to fetch attribute sessions");
}

export async function activateAttributeSession(sessionId: string): Promise<AttributeSession> {
  return requestJson<AttributeSession>(apiUrl(`/api/attributes/sessions/${sessionId}/activate`), {
    method: "POST",
    headers: authHeaders(),
  }, "Failed to activate attribute session");
}

export async function deleteAttributeSession(sessionId: string) {
  return requestJson(apiUrl(`/api/attributes/sessions/${sessionId}`), {
    method: "DELETE",
    headers: authHeaders(),
  }, "Failed to delete attribute session");
}

export async function saveAttributeSession(payload: { selected_attributes: string[]; available_attributes?: string[]; session_title?: string | null; session_id?: string | null }): Promise<AttributeSession> {
  return requestJson<AttributeSession>(apiUrl("/api/attributes/session"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }, "Failed to save attribute session");
}

export async function uploadCsv(supplierId: string, file: File): Promise<ImportCreateResponse> {
  const form = new FormData();
  form.append("file", file);
  const url = new URL(apiUrl("/api/imports/csv"));
  url.searchParams.set("supplier_id", supplierId);
  return requestJson<ImportCreateResponse>(url.toString(), { method: "POST", body: form, headers: authHeaders() }, "CSV upload failed", 30000);
}

export async function createProduct(payload: {
  supplier_id: string;
  title?: string;
  description?: string;
  supplier_sku?: string;
  mapped_attributes?: Record<string, any>;
}) {
  return requestJson(apiUrl("/api/products"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }, "Failed to create product");
}

export async function updateProduct(productId: string, payload: { title?: string; description?: string; mapped_attributes?: Record<string, any> }) {
  return requestJson(apiUrl(`/api/products/${productId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }, "Failed to update product");
}

export async function deleteProduct(productId: string) {
  return requestJson(apiUrl(`/api/products/${productId}`), {
    method: "DELETE",
    headers: { ...authHeaders() },
  }, "Failed to delete product");
}

export async function approveProduct(productId: string, status: "approved" | "rejected") {
  await request(apiUrl(`/api/products/${productId}/approve`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status }),
  }, "Failed to update status");
}

export async function fetchApprovals(params?: { productId?: string }): Promise<ApprovalItem[]> {
  const url = new URL(apiUrl("/api/approvals"));
  if (params?.productId) url.searchParams.set("product_id", params.productId);
  return requestJson<ApprovalItem[]>(url.toString(), { headers: authHeaders() }, "Failed to fetch approvals");
}

export async function enqueueSync(payload: { supplier_id?: string }) {
  return requestJson(apiUrl("/api/sync/enqueue"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }, "Failed to enqueue sync");
}

export async function processSync(payload: { limit: number }) {
  return requestJson(apiUrl("/api/sync/process"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }, "Failed to process sync queue");
}

export async function fetchSyncQueue(): Promise<SyncItem[]> {
  return requestJson<SyncItem[]>(apiUrl("/api/sync/queue"), { headers: authHeaders() }, "Failed to fetch sync queue");
}

export async function seedDemo() {
  return requestJson(apiUrl("/api/seed"), {
    method: "POST",
    headers: { ...authHeaders() },
  }, "Failed to seed demo data");
}

export async function requestPasswordReset(email: string): Promise<string> {
  const res = await apiFetch(apiUrl("/auth/forgot"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* ignore */
    }
    const detail = parsed?.detail || text;
    throw new Error(detail || "Failed to send reset email");
  }
  const data = await res.json();
  return data?.message ?? "Reset email sent.";
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const res = await apiFetch(apiUrl("/auth/reset"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const detail = data?.detail || text || "Failed to reset password";
    throw new Error(detail);
  }
  return data?.message ?? "Password updated";
}

export async function login(username: string, password: string) {
  const res = await apiFetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* ignore */
    }
    const detail = parsed?.detail || text;
    throw new Error(detail || "Login failed");
  }
  return res.json();
}
