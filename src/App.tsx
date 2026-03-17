import { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  API_BASE,
  approveProduct,
  login,
  createProduct,
  createSupplier,
  deleteProduct,
  deleteSupplier,
  fetchApprovals,
  fetchAttributeSession,
  fetchAttributes,
  fetchImports,
  fetchProducts,
  fetchSuppliers,
  fetchSyncQueue,
  AttributeRule,
  ImportItem,
  Product,
  Supplier,
  enqueueSync,
  processSync,
  saveAttributeSession,
  updateProduct,
  uploadCsv,
  updateSupplier,
  activateAttributeSession,
} from "./api";
import Layout from "./components/Layout";
import ProductEditor from "./components/ProductEditor";
import DashboardPage from "./pages/DashboardPage";
import SuppliersPage from "./pages/SuppliersPage";
import ImportsPage from "./pages/ImportsPage";
import ProductsPage from "./pages/ProductsPage";
import OperationsPage from "./pages/OperationsPage";
import MasterAttributeSessionPage from "./pages/MasterAttributeSessionPage";
import SyncPage from "./pages/SyncPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [imports, setImports] = useState<ImportItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [attributes, setAttributes] = useState<AttributeRule[]>([]);
  const [activeAttributes, setActiveAttributes] = useState<string[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([]);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(() => sessionStorage.getItem("adminAuth") === "true");
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const pollTimerRef = useRef<number | null>(null);
  const isImportProcessing = imports.some((item) => item.status === "processing");
  const showImportLoading = isUploading || isImportProcessing;
  const effectiveActiveAttributes = activeAttributes.length
    ? activeAttributes
    : attributes.filter((attr) => attr.active).map((attr) => attr.master_attribute);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }

  async function handleLogin(username: string, password: string) {
    await login(username, password);
    sessionStorage.setItem("adminAuth", "true");
    setIsAuthed(true);
    await load();
    navigate("/", { replace: true });
  }

  function handleLogout() {
    sessionStorage.removeItem("adminAuth");
    stopPolling();
    setIsAuthed(false);
    setIsUploading(false);
    setSelectedProduct(null);
    setImports([]);
    setProducts([]);
    setSuppliers([]);
    setAttributes([]);
    setActiveAttributes([]);
    setAvailableAttributes([]);
    setSyncQueue([]);
    setApprovals([]);
    navigate("/login", { replace: true });
  }


  async function load() {
    try {
      setError(null);
      const results = await Promise.allSettled([
        fetchProducts(),
        fetchImports({ supplierId: supplierId || undefined }),
        fetchSuppliers(),
        fetchAttributes(),
        fetchSyncQueue(),
        fetchApprovals(),
        fetchAttributeSession(),
      ]);

      const [productsRes, importsRes, suppliersRes, attributesRes, syncRes, approvalsRes, attributeSessionRes] = results;

      setProducts(productsRes.status === "fulfilled" ? productsRes.value : []);
      setImports(importsRes.status === "fulfilled" ? importsRes.value : []);
      setSuppliers(suppliersRes.status === "fulfilled" ? suppliersRes.value : []);
      setAttributes(attributesRes.status === "fulfilled" ? attributesRes.value : []);
      setSyncQueue(syncRes.status === "fulfilled" ? syncRes.value : []);
      setApprovals(approvalsRes.status === "fulfilled" ? approvalsRes.value : []);
      if (attributeSessionRes.status === "fulfilled") {
        setActiveAttributes(attributeSessionRes.value.selected_attributes || []);
        setAvailableAttributes(attributeSessionRes.value.available_attributes || []);
        setSessionTitle(attributeSessionRes.value.session_title || "");
      } else {
        setActiveAttributes([]);
        setAvailableAttributes([]);
        setSessionTitle("");
      }

      const errors = results
        .slice(0, 6)
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));

      if (errors.length > 0) {
        const allNetworkErrors = errors.every((m) => m === "Failed to fetch");
        if (allNetworkErrors) {
          const isLocalFrontend =
            window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          const isLocalApi = API_BASE.includes("127.0.0.1") || API_BASE.includes("localhost");

          if (!isLocalFrontend && isLocalApi) {
            setError(
              `Frontend is configured to call a local backend (${API_BASE}). Set VITE_API_BASE in Vercel to your Render backend URL and redeploy.`,
            );
          } else {
            setError(`Backend not reachable at ${API_BASE}.`);
          }
        } else {
          setError(errors[0]);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    }
  }

  useEffect(() => {
    if (!isAuthed) {
      stopPolling();
      setIsUploading(false);
      return;
    }
    load();
    return () => {
      stopPolling();
    };
  }, [isAuthed, location.pathname]);

  function stopPolling() {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (!isAuthed) {
      return;
    }
    const hasProcessing = imports.some((item) => item.status === "processing");
    if (!hasProcessing) {
      stopPolling();
      return;
    }
    if (pollTimerRef.current !== null) {
      return;
    }
    pollTimerRef.current = window.setInterval(() => {
      load();
    }, 2000);
    return () => {
      stopPolling();
    };
  }, [imports, isAuthed]);

  async function pollImportUntilDone(importId: string) {
    stopPolling();
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const importData = await fetchImports();
        const current = importData.find((item) => item._id === importId);
        if (!current) {
          stopPolling();
          await load();
          return;
        }
        if (current.status !== "processing") {
          stopPolling();
          await load();
          return;
        }
        const productData = await fetchProducts();
        setProducts(productData);
        setImports(importData);
      } catch {
        // Ignore transient errors while polling.
      }
    }, 2000);
  }

  async function handleDecision(id: string, decision: "approved" | "rejected") {
    await approveProduct(id, decision);
    await load();
    notify(decision === "approved" ? "Approved" : "Rejected");
  }

  async function handleUpload(file: File) {
    if (!supplierId) {
      throw new Error("Supplier ID required");
    }
    setIsUploading(true);
    try {
      const result = await uploadCsv(supplierId, file);
      await load();
      const importId = result?.import_id;
      if (importId) {
        await pollImportUntilDone(importId);
      }
      // Temporary: reset filters so products are visible immediately.
      setSupplierId("");
      setStatus("");
    } catch (err) {
      try {
        await load();
        return;
      } catch {
        throw err;
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function handleCreateSupplier(payload: { name: string; code: string }) {
    await createSupplier(payload);
    await load();
    notify("Supplier saved");
  }

  async function handleUpdateSupplier(id: string, payload: { name?: string; code?: string }) {
    await updateSupplier(id, payload);
    await load();
    notify("Supplier updated");
  }

  async function handleDeleteSupplier(id: string) {
    if (!confirm("Delete this supplier?")) {
      return;
    }
    await deleteSupplier(id);
    await load();
    notify("Supplier deleted");
  }

  async function handleEnqueueSync() {
    await enqueueSync({ supplier_id: supplierId || undefined });
    await load();
  }

  async function handleProcessSync() {
    await processSync({ limit: 50 });
    await load();
  }

  async function handleSaveProduct(updated: { id: string; title?: string; description?: string; mapped_attributes?: Record<string, any> }) {
    await updateProduct(updated.id, {
      title: updated.title,
      description: updated.description,
      mapped_attributes: updated.mapped_attributes,
    });
    setSelectedProduct(null);
    await load();
    notify("Product saved");
  }

  async function handleCreateProduct(payload: { supplier_id: string; title?: string; description?: string; supplier_sku?: string; mapped_attributes?: Record<string, any> }) {
    await createProduct(payload);
    await load();
    notify("Product saved");
  }

  async function handleDeleteProduct(id: string) {
    await deleteProduct(id);
    await load();
    notify("Product deleted");
  }

  async function handleSaveAttributeSession(selected: string[], available: string[], title: string, sessionId?: string | null) {
    const result = await saveAttributeSession({
      selected_attributes: selected,
      available_attributes: available,
      session_title: title,
      session_id: sessionId,
    });
    setActiveAttributes(result.selected_attributes || []);
    setAvailableAttributes(result.available_attributes || []);
    setSessionTitle(result.session_title || "");
    await load();
    notify("Master attribute session saved");
    return result;
  }

  async function handleActivateAttributeSession(sessionId: string) {
    const result = await activateAttributeSession(sessionId);
    setActiveAttributes(result.selected_attributes || []);
    setAvailableAttributes(result.available_attributes || []);
    setSessionTitle(result.session_title || "");
    await load();
    notify("Session activated");
  }


  if (!isAuthed && location.pathname !== "/login" && location.pathname !== "/reset-password") {
    return <Navigate to="/login" replace />;
  }

  if (isAuthed && (location.pathname === "/login" || location.pathname === "/reset-password")) {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === "/login") {
    return <LoginPage onLogin={handleLogin} />;
  }
  if (location.pathname === "/reset-password") {
    return <ResetPasswordPage />;
  }

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              suppliersCount={suppliers.length}
              attributesCount={effectiveActiveAttributes.length}
              productsCount={products.length}
              approvalsCount={approvals.length}
              onRefresh={load}
            />
          }
        />
        <Route
          path="/suppliers"
          element={
            <SuppliersPage
              suppliers={suppliers}
              onCreate={handleCreateSupplier}
              onUpdate={handleUpdateSupplier}
              onDelete={handleDeleteSupplier}
              onNotify={notify}
            />
          }
        />
        <Route
          path="/operations"
          element={<OperationsPage />}
        />
        <Route
          path="/master-attribute-session"
          element={
            <MasterAttributeSessionPage
              selectedAttributes={activeAttributes}
              availableAttributes={availableAttributes}
              sessionTitle={sessionTitle}
              onSaveAttributeSession={handleSaveAttributeSession}
              onActivateSession={handleActivateAttributeSession}
            />
          }
        />
        <Route
          path="/imports"
          element={
            <ImportsPage
              suppliers={suppliers}
              imports={imports}
              selectedSupplier={supplierId}
              onSelectSupplier={setSupplierId}
              onUpload={handleUpload}
            />
          }
        />
        <Route
          path="/products"
          element={
            <ProductsPage
              products={products}
              suppliers={suppliers}
              supplierId={supplierId}
              status={status}
              onSupplierIdChange={setSupplierId}
              onStatusChange={setStatus}
              onRefresh={load}
              onCreate={handleCreateProduct}
              onDecision={handleDecision}
              onEdit={(p) => {
                setSelectedProduct(p);
                notify("Edit mode opened");
              }}
              onDelete={handleDeleteProduct}
              activeAttributes={effectiveActiveAttributes}
            />
          }
        />
        <Route path="/sync" element={<SyncPage items={syncQueue} onEnqueue={handleEnqueueSync} onProcess={handleProcessSync} />} />
        <Route path="/approvals" element={<ApprovalsPage items={approvals} />} />
      </Routes>

      {showImportLoading && <div className="card">Loading...</div>}
      {error && <div className="card error">{error}</div>}

      {selectedProduct && (
        <ProductEditor
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSave={handleSaveProduct}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </Layout>
  );
}
