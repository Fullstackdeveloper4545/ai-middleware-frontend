import { useState } from "react";
import { Product } from "../api";

type Props = {
  product: Product;
  onSave: (payload: { id: string; title?: string; description?: string; mapped_attributes?: Record<string, any> }) => void;
  onClose: () => void;
};

export default function ProductEditor({ product, onSave, onClose }: Props) {
  const [title, setTitle] = useState(product.title || "");
  const [description, setDescription] = useState(product.description || "");
  const [attrs, setAttrs] = useState<Record<string, string>>({ ...product.mapped_attributes });

  function handleAttrChange(key: string, value: string) {
    setAttrs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Product</h2>
          <button className="button ghost" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="attr-edit">
            {Object.entries(attrs).map(([k, v]) => (
              <div key={k} className="attr-row">
                <span>{k}</span>
                <input value={v} onChange={(e) => handleAttrChange(k, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="button" onClick={() => onSave({ id: product._id, title, description, mapped_attributes: attrs })}>Save</button>
        </div>
      </div>
    </div>
  );
}
