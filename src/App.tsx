import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import {
  approveProduct,
  createProduct,
  createSupplier,
  deleteProduct,
  deleteSupplier,
  fetchApprovals,
  fetchAttributes,
  fetchImports,
  fetchProducts,
  fetchSuppliers,
  fetchSyncQueue,
  ImportItem,
  Product,
  Supplier,
  enqueueSync,
  processSync,
  updateProduct,
  uploadCsv,
  upsertAttribute,
  updateSupplier,
} from "./api";
import Layout from "./components/Layout";
import ProductEditor from "./components/ProductEditor";
import DashboardPage from "./pages/DashboardPage";
import SuppliersPage from "./pages/SuppliersPage";
import AttributesPage from "./pages/AttributesPage";
import ImportsPage from "./pages/ImportsPage";
import ProductsPage from "./pages/ProductsPage";
import OperationsPage from "./pages/OperationsPage";
import SyncPage from "./pages/SyncPage";
import ApprovalsPage from "./pages/ApprovalsPage";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [imports, setImports] = useState<ImportItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }


  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [productData, importData, supplierData, attributeData, queueData, approvalData] = await Promise.all([
        fetchProducts({ supplierId: supplierId || undefined, status: status || undefined }),
        fetchImports({ supplierId: supplierId || undefined }),
        fetchSuppliers(),
        fetchAttributes(),
        fetchSyncQueue(),
        fetchApprovals(),
      ]);
      setProducts(productData);
      setImports(importData);
      setSuppliers(supplierData);
      setAttributes(attributeData);
      setSyncQueue(queueData);
      setApprovals(approvalData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "Failed to fetch") {
        setError("Backend not running at http://127.0.0.1:8000. Start it with start-dev.ps1.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDecision(id: string, decision: "approved" | "rejected") {
    await approveProduct(id, decision);
    await load();
    notify(decision === "approved" ? "Approved" : "Rejected");
  }

  async function handleUpload(file: File) {
    if (!supplierId) {
      throw new Error("Supplier ID required");
    }
    try {
      await uploadCsv(supplierId, file);
      await load();
    } catch (err) {
      try {
        await load();
        return;
      } catch {
        throw err;
      }
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

  async function handleUpsertAttribute(payload: { master_attribute: string; allowed_values: string[]; rules?: string }) {
    await upsertAttribute(payload);
    await load();
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
    if (!confirm("Delete this product?")) {
      return;
    }
    await deleteProduct(id);
    await load();
    notify("Product deleted");
  }


  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              suppliersCount={suppliers.length}
              attributesCount={attributes.length}
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
          path="/attributes"
          element={<AttributesPage attributes={attributes} onUpsert={handleUpsertAttribute} />}
        />
        <Route path="/operations" element={<OperationsPage />} />
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
            />
          }
        />
        <Route path="/sync" element={<SyncPage items={syncQueue} onEnqueue={handleEnqueueSync} onProcess={handleProcessSync} />} />
        <Route path="/approvals" element={<ApprovalsPage items={approvals} />} />
      </Routes>

      {loading && <div className="card">Loading...</div>}
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
