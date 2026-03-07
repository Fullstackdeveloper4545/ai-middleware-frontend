import { ApprovalItem } from "../api";

type Props = { items: ApprovalItem[] };

export default function ApprovalHistory({ items }: Props) {
  return (
    <div className="card">
      <h2>Approval History</h2>
      {items.length === 0 && <div className="muted">No approvals yet.</div>}
      {items.length > 0 && (
        <div className="approval-list">
          {items.map((a) => (
            <div key={a._id} className="approval-row">
              <div>
                <div className="title">Product: {a.product_id}</div>
                <div className="muted">{new Date(a.updated_at).toLocaleString()}</div>
              </div>
              <div className={`status status-${a.status}`}>{a.status}</div>
              {a.notes && <div className="muted">{a.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
