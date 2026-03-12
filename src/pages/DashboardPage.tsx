import { Link } from "react-router-dom";

type Props = {
  suppliersCount: number;
  attributesCount: number;
  productsCount: number;
  approvalsCount: number;
  onRefresh: () => void;
};

export default function DashboardPage({
  suppliersCount,
  attributesCount,
  productsCount,
  approvalsCount,
  onRefresh,
}: Props) {
  return (
    <>
      <section className="page-header">
        <div>
          <h1>AI Middleware Review</h1>
          <p>Upload supplier data, review attributes, and approve products.</p>
        </div>
        <div className="header-actions">
          <button className="button" onClick={onRefresh}>Refresh</button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Suppliers</div>
          <div className="stat-value">{suppliersCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Master Attributes</div>
          <div className="stat-value">{attributesCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value">{productsCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approvals</div>
          <div className="stat-value">{approvalsCount}</div>
        </div>
      </section>

      <section className="action-row">
        <Link className="action-button" to="/suppliers">Add Supplier</Link>
        <Link className="action-button outline" to="/imports">Upload CSV</Link>
      </section>

    </>
  );
}
