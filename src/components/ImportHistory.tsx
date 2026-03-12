import { ImportItem } from "../api";

type Props = { items: ImportItem[] };

export default function ImportHistory({ items }: Props) {
  if (items.length === 0) {
    return <div className="card">No imports yet.</div>;
  }

  return (
    <div className="card">
      <h2>Import History</h2>
      <div className="import-list">
        {items.map((item) => (
          <div key={item._id} className="import-row">
            <div>
              <div className="title">{item.source_ref}</div>
              <div className="muted">Supplier: {item.supplier_id}</div>
              {item.status && <div className="muted">Status: {item.status}</div>}
              {item.error && <div className="muted">Error: {item.error}</div>}
            </div>
            <div className="muted">Rows: {item.total_rows}</div>
            <div className="muted">{new Date(item.imported_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
