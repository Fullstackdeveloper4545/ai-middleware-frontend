import { useState } from "react";

const tabs = [
  "Stock Management",
  "Document Management",
  "Attendance Management",
  "Expenses Management",
  "Services Management",
  "Products Management",
  "Parts (New/Old)",
  "Marketing Sales Leads",
];

export default function OperationsPage() {
  const [active, setActive] = useState(tabs[0]);

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Business Operations</h1>
          <p>Manual management for stock, documents, attendance, expenses, services, products, parts and leads.</p>
        </div>
      </section>

      <div className="card">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`tab-button${active === tab ? " active" : ""}`}
              onClick={() => setActive(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="ops-form">
          <label>Title</label>
          <input placeholder="Enter title" />
          <label>Details</label>
          <textarea placeholder="Add details" />
          <label>Tag (optional)</label>
          <input placeholder="Category / Label" />
          <button className="button">Add Entry</button>
        </div>
      </div>

      <div className="card">
        <h2>Saved Entries (0)</h2>
        <p className="muted">No entries added yet.</p>
      </div>
    </>
  );
}
