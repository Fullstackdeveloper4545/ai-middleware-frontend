import { useState } from "react";
import { Supplier } from "../api";

type Props = {
  suppliers: Supplier[];
  onCreate: (payload: { supplier_id: string; title?: string; description?: string; supplier_sku?: string; mapped_attributes?: Record<string, any> }) => Promise<void>;
};

export default function ManualProductForm({ suppliers, onCreate }: Props) {
  const [supplierId, setSupplierId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [attrs, setAttrs] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!supplierId) {
      setError("Select supplier");
      return;
    }
    setError(null);
    const mapped: Record<string, any> = {};
    if (attrs.trim()) {
      attrs.split(",").forEach((pair) => {
        const [k, v] = pair.split(":").map((s) => s.trim());
        if (k) mapped[k] = v || "";
      });
    }
    await onCreate({
      supplier_id: supplierId,
      title: title || undefined,
      description: description || undefined,
      supplier_sku: sku || undefined,
      mapped_attributes: Object.keys(mapped).length ? mapped : undefined,
    });
    setTitle("");
    setDescription("");
    setSku("");
    setAttrs("");
  }

  return (
    <div className="card">
      <h2>Manual Product Entry</h2>
      <div className="manual-form">
        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">Select supplier</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
          ))}
        </select>
        <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <input value={attrs} onChange={(e) => setAttrs(e.target.value)} placeholder="Mapped attrs: Color:Red, Size:M" />
        <button className="button small" onClick={handleSubmit}>Add Product</button>
      </div>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
