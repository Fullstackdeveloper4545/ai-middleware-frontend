import { Product } from "../api";

type Props = {
  products: Product[];
  onDecision: (id: string, status: "approved" | "rejected") => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
};

export default function ProductTable({ products, onDecision, onEdit, onDelete }: Props) {
  if (products.length === 0) {
    return <div className="card">No products found.</div>;
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    if (Array.isArray(value)) {
      return value.filter((v) => v !== null && v !== undefined && v !== "").join(", ") || "—";
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const allowedOrder = [
    "Color",
    "SKU",
    "Title",
    "Category",
    "Image 2",
    "Description",
    "B2B price",
    "Size",
  ];

  return (
    <div className="table">
      <div className="table-head">
        <div>Title</div>
        <div>Supplier</div>
        <div>Status</div>
        <div>Attributes</div>
        <div>Actions</div>
      </div>
      {products.map((p) => (
        <div className={`table-row ${p.extraction_confidence < 0.5 ? "low-confidence" : ""}`} key={p._id}>
          <div>
            <div className="title">{p.title || "(No title)"}</div>
            <div className="muted">SKU: {p.supplier_sku || "-"}</div>
            <div className="muted">Confidence: {(p.extraction_confidence * 100).toFixed(0)}%</div>
          </div>
          <div className="muted">{p.supplier_id}</div>
          <div>
            <span className={`status status-${p.approval_status}`}>{p.approval_status}</span>
          </div>
          <div className="attrs-table">
            <div className="attrs-head">
              <span>Attribute</span>
              <span>Value</span>
            </div>
            {(() => {
              const attrs = p.mapped_attributes || {};
              const lower = Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k.toLowerCase(), v]));
              return allowedOrder.map((k) => (
                <div key={k} className="attrs-row">
                  <span>{k}</span>
                  <span>{formatValue(lower[k.toLowerCase()])}</span>
                </div>
              ));
            })()}
          </div>
          <div className="actions">
            <button className="button" onClick={() => onEdit(p)}>Edit</button>
            <button className="button" onClick={() => onDecision(p._id, "approved")}>Approve</button>
            <button className="button" onClick={() => onDecision(p._id, "rejected")}>Reject</button>
            <button className="button danger" onClick={() => onDelete(p._id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
