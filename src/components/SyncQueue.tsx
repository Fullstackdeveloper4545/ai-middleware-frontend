import { SyncItem } from "../api";

type Props = {
  items: SyncItem[];
  onEnqueue: () => Promise<void>;
  onProcess: () => Promise<void>;
};

export default function SyncQueue({ items, onEnqueue, onProcess }: Props) {
  return (
    <div className="card">
      <div className="sync-header">
        <h2>Shopify Sync Queue</h2>
        <div className="sync-actions">
          <button className="button" onClick={onEnqueue}>Enqueue Approved</button>
          <button className="button ghost" onClick={onProcess}>Process Queue</button>
        </div>
      </div>
      {items.length === 0 && <div className="muted">No queued items.</div>}
      {items.length > 0 && (
        <div className="sync-list">
          {items.map((item) => (
            <div key={item._id} className="sync-row">
              <div>
                <div className="title">Product: {item.product_id}</div>
                <div className="muted">Supplier: {item.supplier_id}</div>
                {item.error && item.status === "failed" && (
                  <div className="error-text">{item.error}</div>
                )}
              </div>
              <div className={`status status-${item.status}`}>{item.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
