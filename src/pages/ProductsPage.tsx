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
  onDelete: (id: string) => void;
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
}: Props) {
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
          <label>Supplier ID</label>
          <input value={supplierId} onChange={(e) => onSupplierIdChange(e.target.value)} placeholder="e.g. SUP-001" />
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

      <ManualProductForm suppliers={suppliers} onCreate={onCreate} />
      <ProductTable products={products} onDecision={onDecision} onEdit={onEdit} onDelete={onDelete} />
    </>
  );
}
