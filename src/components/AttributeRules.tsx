import { useState } from "react";
import { AttributeRule } from "../api";

type Props = {
  items: AttributeRule[];
  onUpsert: (payload: { master_attribute: string; allowed_values: string[]; rules?: string }) => Promise<void>;
};

export default function AttributeRules({ items, onUpsert }: Props) {
  const [master, setMaster] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!master) {
      setError("Master attribute is required");
      return;
    }
    setError(null);
    await onUpsert({
      master_attribute: master,
      allowed_values: [],
      rules: undefined,
    });
    setMaster("");
  }

  return (
    <div className="card">
      <div className="attribute-header">
        <div>
          <h2>Master Attributes</h2>
          <p className="muted">Add attribute names only (e.g. Color, Size).</p>
        </div>
      </div>
      <div className="attribute-form">
        <div className="attribute-grid single">
          <div className="field">
            <label>Attribute name</label>
            <input value={master} onChange={(e) => setMaster(e.target.value)} placeholder="e.g. Color" />
          </div>
          <button className="button" onClick={handleSave}>Save</button>
        </div>
      </div>
      {error && <div className="error-text">{error}</div>}
      <div className="attribute-list">
        {items.map((a) => (
          <div key={a._id} className="attribute-row">
            <div className="title">{a.master_attribute}</div>
          </div>
        ))}
        {items.length === 0 && <div className="muted">No attributes yet.</div>}
      </div>
    </div>
  );
}
