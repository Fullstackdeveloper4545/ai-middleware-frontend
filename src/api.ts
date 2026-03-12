export type Product = {
  _id: string;
  supplier_id: string;
  title?: string;
  description?: string;
  supplier_sku?: string;
  approval_status: string;
  extraction_confidence: number;
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


export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || "http://127.0.0.1:8000";

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

export async function fetchProducts(params?: { supplierId?: string; status?: string }): Promise<Product[]> {
  const url = new URL(API_BASE + "/api/products");
  if (params?.supplierId) url.searchParams.set("supplier_id", params.supplierId);
  if (params?.status) url.searchParams.set("status", params.status);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function fetchImports(params?: { supplierId?: string }): Promise<ImportItem[]> {
  const url = new URL(API_BASE + "/api/imports");
  if (params?.supplierId) url.searchParams.set("supplier_id", params.supplierId);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch imports");
  return res.json();
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch(API_BASE + "/api/suppliers", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch suppliers");
  return res.json();
}

export async function createSupplier(payload: { name: string; code: string }): Promise<Supplier> {
  const res = await fetch(API_BASE + "/api/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create supplier");
  return res.json();
}

export async function updateSupplier(id: string, payload: { name?: string; code?: string; status?: string }): Promise<Supplier> {
  const res = await fetch(API_BASE + `/api/suppliers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update supplier");
  return res.json();
}

export async function deleteSupplier(id: string) {
  const res = await fetch(API_BASE + `/api/suppliers/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to delete supplier");
  return res.json();
}


export async function fetchAttributes(): Promise<AttributeRule[]> {
  const res = await fetch(API_BASE + "/api/attributes", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch attributes");
  return res.json();
}

export async function upsertAttribute(payload: { master_attribute: string; allowed_values: string[]; rules?: string }) {
  const res = await fetch(API_BASE + "/api/attributes", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to upsert attribute");
  return res.json();
}

export async function fetchAttributeSession(): Promise<AttributeSession> {
  const res = await fetch(API_BASE + "/api/attributes/session", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch attribute session");
  return res.json();
}

export async function fetchAttributeSessions(): Promise<AttributeSession[]> {
  const res = await fetch(API_BASE + "/api/attributes/sessions", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch attribute sessions");
  return res.json();
}

export async function activateAttributeSession(sessionId: string): Promise<AttributeSession> {
  const res = await fetch(API_BASE + `/api/attributes/sessions/${sessionId}/activate`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to activate attribute session");
  return res.json();
}

export async function deleteAttributeSession(sessionId: string) {
  const res = await fetch(API_BASE + `/api/attributes/sessions/${sessionId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete attribute session");
  return res.json();
}

export async function saveAttributeSession(payload: { selected_attributes: string[]; available_attributes?: string[]; session_title?: string | null; session_id?: string | null }): Promise<AttributeSession> {
  const res = await fetch(API_BASE + "/api/attributes/session", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save attribute session");
  return res.json();
}

export async function uploadCsv(supplierId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const url = new URL(API_BASE + "/api/imports/csv");
  url.searchParams.set("supplier_id", supplierId);
  let res: Response;
  try {
    res = await fetchWithTimeout(url.toString(), { method: "POST", body: form, headers: authHeaders() }, 30000);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Upload timed out. Please try again.");
    }
    throw err;
  }
  if (!res.ok) throw new Error("CSV upload failed");
  return res.json();
}

export async function createProduct(payload: {
  supplier_id: string;
  title?: string;
  description?: string;
  supplier_sku?: string;
  mapped_attributes?: Record<string, any>;
}) {
  const res = await fetch(API_BASE + "/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create product");
  return res.json();
}

export async function updateProduct(productId: string, payload: { title?: string; description?: string; mapped_attributes?: Record<string, any> }) {
  const res = await fetch(API_BASE + `/api/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update product");
  return res.json();
}

export async function deleteProduct(productId: string) {
  const res = await fetch(API_BASE + `/api/products/${productId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to delete product");
  return res.json();
}

export async function approveProduct(productId: string, status: "approved" | "rejected") {
  const res = await fetch(API_BASE + `/api/products/${productId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
}

export async function fetchApprovals(params?: { productId?: string }): Promise<ApprovalItem[]> {
  const url = new URL(API_BASE + "/api/approvals");
  if (params?.productId) url.searchParams.set("product_id", params.productId);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch approvals");
  return res.json();
}

export async function enqueueSync(payload: { supplier_id?: string }) {
  const res = await fetch(API_BASE + "/api/sync/enqueue", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to enqueue sync");
  return res.json();
}

export async function processSync(payload: { limit: number }) {
  const res = await fetch(API_BASE + "/api/sync/process", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to process sync queue");
  return res.json();
}

export async function fetchSyncQueue(): Promise<SyncItem[]> {
  const res = await fetch(API_BASE + "/api/sync/queue", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch sync queue");
  return res.json();
}

export async function seedDemo() {
  const res = await fetch(API_BASE + "/api/seed", {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to seed demo data");
  return res.json();
}

export async function requestPasswordReset(email: string): Promise<string> {
  const res = await fetch(API_BASE + "/auth/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || "Failed to send reset email");
  }
  const data = await res.json();
  return data?.message ?? "Reset email sent.";
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const res = await fetch(API_BASE + "/auth/reset", {
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
  const res = await fetch(API_BASE + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || "Login failed");
  }
  return res.json();
}
