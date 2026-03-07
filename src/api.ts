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


const API_BASE = "http://127.0.0.1:8000";

function authHeaders() {
  const key = localStorage.getItem("api_key");
  return key ? { "X-API-Key": key } : {};
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

export async function uploadCsv(supplierId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const url = new URL(API_BASE + "/api/imports/csv");
  url.searchParams.set("supplier_id", supplierId);
  const res = await fetch(url.toString(), { method: "POST", body: form, headers: authHeaders() });
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
