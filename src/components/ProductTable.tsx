import { Product } from "../api";

type Props = {
  products: Product[];
  onDecision: (id: string, status: "approved" | "rejected") => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  activeAttributes: string[];
};

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasValue = (value: any) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((v) => v !== null && v !== undefined && String(v).trim() !== "");
  return true;
};

function guessFromDescription(description: string | undefined, attribute: string): string | null {
  if (!description) return null;
  const attrLabel = attribute.replace(/[_-]/g, " ").trim();
  if (!attrLabel) return null;
  const patterns = [
    // Color: Blue / Size - Large / Style - Modern
    new RegExp(`\\b${escapeRegExp(attrLabel)}\\s*[:\\-\\u2013]\\s*([^\\n;,.]+)`, "i"),
    // Color is Blue
    new RegExp(`\\b${escapeRegExp(attrLabel)}\\s+is\\s+([^\\n;,.]+)`, "i"),
  ];
  for (const re of patterns) {
    const match = description.match(re);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

export default function ProductTable({ products, onDecision, onEdit, onDelete, activeAttributes }: Props) {
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
              // Show only mapped attributes (predefined master attributes).
              const attrs = p.mapped_attributes || {};
              const extracted = p.extracted_attributes || {};
              const lower = Object.fromEntries(
                Object.entries(attrs).map(([k, v]) => [k.toLowerCase(), v])
              );
              const extractedLower = Object.fromEntries(
                Object.entries(extracted).map(([k, v]) => [k.toLowerCase(), v])
              );
              const originalKey = Object.fromEntries(
                Object.keys(attrs).map((k) => [k.toLowerCase(), k])
              );
              const keys = Object.keys(lower);
              const noMapped = keys.length === 0;
              const priority = activeAttributes.map((k) => k.toLowerCase());
              const activeLower = new Set(priority);
              const missingSet = new Set<string>();
              for (const attr of priority) {
                if (!lower.hasOwnProperty(attr) || !hasValue(lower[attr])) {
                  missingSet.add(attr);
                }
              }
              const orderedKeys = [
                ...priority.filter((k) => lower.hasOwnProperty(k) && !missingSet.has(k)),
                ...keys.filter((k) => !priority.includes(k) && !(activeLower.has(k) && missingSet.has(k))),
              ];
              const missing = activeAttributes.filter((attr) => missingSet.has(attr.toLowerCase()));
              return (
                <>
                  {noMapped && (
                    <div className="attrs-row">
                      <span className="muted">No attributes for this product</span>
                      <span className="muted">-</span>
                    </div>
                  )}
                  {orderedKeys.map((k) => (
                    <div key={k} className="attrs-row">
                      <span>{originalKey[k] || k}</span>
                      <span>{formatValue(lower[k])}</span>
                    </div>
                  ))}
                  {missing.length > 0 && (
                    <>
                      <div className="attrs-row">
                        <span className="muted">Missing active attributes</span>
                        <span className="muted">Pulled from extraction or description when possible</span>
                      </div>
                      {missing.map((attr) => {
                        const key = attr.toLowerCase();
                        const extractedValue = extractedLower[key];
                        const guess = extractedValue ? String(extractedValue) : guessFromDescription(p.description, attr);
                        const sourceLabel = extractedValue ? "from extraction" : guess ? "from description" : "";
                        return (
                          <div key={attr} className="attrs-row">
                            <span>{attr}</span>
                            <span>{guess ? `${guess} (${sourceLabel})` : "-"}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              );
            })()}
          </div>
          <div className="actions">
            <button className="button" onClick={() => onEdit(p)}>Edit</button>
            <button className="button" onClick={() => onDecision(p._id, "approved")}>Approve</button>
            <button className="button" onClick={() => onDecision(p._id, "rejected")}>Reject</button>
            <button className="button danger" onClick={() => onDelete(p)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
