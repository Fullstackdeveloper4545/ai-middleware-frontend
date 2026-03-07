import { NavLink } from "react-router-dom";
import { useState } from "react";

type NavItem = { label: string; to: string };

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/" },
  { label: "Suppliers", to: "/suppliers" },
  { label: "Master Attributes", to: "/attributes" },
  { label: "Operations", to: "/operations" },
  { label: "Imports", to: "/imports" },
  { label: "Products", to: "/products" },
  { label: "Sync", to: "/sync" },
  { label: "Approvals", to: "/approvals" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">
            <span className="brand-accent">AI</span> Middleware
          </div>
          <div className="brand-sub">Supplier Data Manager</div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="mobile-topbar">
        <div className="brand-title">
          <span className="brand-accent">AI</span> Middleware
        </div>
        <button className="button ghost" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="mobile-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      <main className="content">{children}</main>
    </div>
  );
}
