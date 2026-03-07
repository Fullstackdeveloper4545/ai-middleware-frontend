import { useState } from "react";
import { Supplier } from "../api";

type Props = {
  items: Supplier[];
  onCreate: (payload: { name: string; code: string }) => Promise<void>;
  onUpdate: (id: string, payload: { name?: string; code?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNotify?: (message: string) => void;
};

export default function SupplierPanel({ items, onCreate, onUpdate, onDelete, onNotify }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name || !code) {
      setError("Name and Code required");
      return;
    }
    setError(null);
    if (editingId) {
      await onUpdate(editingId, { name, code });
      setEditingId(null);
      onNotify?.("Supplier updated");
    } else {
      await onCreate({ name, code });
      onNotify?.("Supplier saved");
    }
    setName("");
    setCode("");
  }

  function handleEdit(supplier: Supplier) {
    setEditingId(supplier._id);
    setName(supplier.name || "");
    setCode(supplier.code || "");
    onNotify?.("Edit mode opened");
  }

  async function handleDelete(id: string) {
    await onDelete(id);
  }

  return (
    <div className="card">
      <h2>Suppliers</h2>
      <div className="supplier-form">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name" />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Supplier code" />
        <button className="button" onClick={handleCreate}>{editingId ? "Update" : "Add"}</button>
      </div>
      {error && <div className="error-text">{error}</div>}
      <div className="supplier-list">
        {items.map((s) => (
          <div key={s._id} className="supplier-row">
            <div className="title">{s.name}</div>
            <div className="muted">{s.code}</div>
            <div className="actions">
              <button className="button" onClick={() => handleEdit(s)}>Edit</button>
              <button className="button" onClick={() => handleDelete(s._id)}>Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="muted">No suppliers yet.</div>}
      </div>
    </div>
  );
}
