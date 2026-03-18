import { useState } from "react";
import ManualProductForm from "../components/ManualProductForm";
import ProductTable from "../components/ProductTable";
import { Product, Supplier } from "../api";

type Props = {
  products: Product[];
  suppliers: Supplier[];
  supplierId: string;
  status: string;
  onSupplierIdChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onRefresh: () => void;
  onCreate: (payload: { supplier_id: string; title?: string; description?: string; supplier_sku?: string; mapped_attributes?: Record<string, any> }) => Promise<void>;
  onDecision: (id: string, status: "approved" | "rejected") => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => Promise<void>;
  activeAttributes: string[];
};

export default function ProductsPage({
  products,
  suppliers,
  supplierId,
  status,
  onSupplierIdChange,
  onStatusChange,
  onRefresh,
  onCreate,
  onDecision,
  onEdit,
  onDelete,
  activeAttributes,
}: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const trimmedSupplierId = supplierId.trim();
  const supplierFilter = trimmedSupplierId.toLowerCase();
  const isObjectId = /^[a-f0-9]{24}$/i.test(trimmedSupplierId);
  const matchedSupplierIds = new Set(
    !supplierFilter || isObjectId
      ? []
      : suppliers
        .filter((s) =>
          s.code.toLowerCase().includes(supplierFilter) ||
          s.name.toLowerCase().includes(supplierFilter)
        )
        .map((s) => s._id)      
  );
  const filteredProducts = products.filter((p) => {
    let supplierMatch = true;
    if (trimmedSupplierId) {
      if (isObjectId) {
        supplierMatch = p.supplier_id === trimmedSupplierId;
      } else if (matchedSupplierIds.size > 0) {
        supplierMatch = matchedSupplierIds.has(p.supplier_id);
      } else {
        supplierMatch = p.supplier_id.toLowerCase().includes(supplierFilter);
      }
    }
    const statusMatch = status ? p.approval_status === status : true;
    return supplierMatch && statusMatch;
  });

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Products</h1>
          <p>Review extracted products and manage approvals.</p>
        </div>
        <button className="button" onClick={onRefresh}>Refresh</button>
      </section>

      <section className="filters">
        <div className="field">
          <label>Supplier ID / Code</label>
          <input value={supplierId} onChange={(e) => onSupplierIdChange(e.target.value)} placeholder="e.g. 69ae... or SUP-001" />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button className="button" onClick={onRefresh}>Apply</button>
      </section>

      {products.length > 0 && filteredProducts.length === 0 && (
        <div className="card">
          Products exist, but current filters hide them.
          <button className="button" style={{ marginLeft: 12 }} onClick={() => { onSupplierIdChange(""); onStatusChange(""); }}>
            Clear Filters
          </button>
        </div>
      )}

      <ManualProductForm suppliers={suppliers} onCreate={onCreate} />
      <ProductTable
        products={filteredProducts}
        onDecision={onDecision}
        onEdit={onEdit}
        onDelete={(product) => {
          setDeleteTarget(product);
          setDeleteError(null);
        }}
        activeAttributes={activeAttributes}
      />

      {deleteTarget && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Delete Product</h2>
              <button className="button ghost" onClick={() => setDeleteTarget(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>Do you want to delete "{deleteTarget.title || "Untitled Product"}"?</p>
              <div className="muted">SKU: {deleteTarget.supplier_sku || "-"}</div>
              {deleteError && <div className="error-text">{deleteError}</div>}
            </div>
            <div className="modal-actions">
              <button className="button ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button
                className="button danger"
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError(null);
                  try {
                    await onDelete(deleteTarget._id);
                    setDeleteTarget(null);
                  } catch (err) {
                    setDeleteError(err instanceof Error ? err.message : "Failed to delete product.");
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
