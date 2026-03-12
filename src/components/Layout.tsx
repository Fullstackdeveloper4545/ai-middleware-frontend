import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

type NavItem = { label: string; to: string };

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/" },
  { label: "Suppliers", to: "/suppliers" },
  { label: "Operations", to: "/operations" },
  { label: "Master Session", to: "/master-attribute-session" },
  { label: "Imports", to: "/imports" },
  { label: "Products", to: "/products" },
  { label: "Sync", to: "/sync" },
  { label: "Approvals", to: "/approvals" },
];

type Props = {
  children: React.ReactNode;
  onLogout?: () => void;
};

export default function Layout({ children, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [closeMenuAfterNav, setCloseMenuAfterNav] = useState(false);
  const navigate = useNavigate();

  function requestLeave(path: string, closeMenu = false) {
    setPendingPath(path);
    setCloseMenuAfterNav(closeMenu);
    setShowLeave(true);
  }

  function confirmLeave() {
    if (!pendingPath) return;
    navigate(pendingPath);
    if (closeMenuAfterNav) setOpen(false);
    setShowLeave(false);
    setPendingPath(null);
    setCloseMenuAfterNav(false);
  }

  function cancelLeave() {
    setShowLeave(false);
    setPendingPath(null);
    setCloseMenuAfterNav(false);
  }

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
              onClick={(e) => {
                e.preventDefault();
                requestLeave(item.to);
              }}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {onLogout && (
          <button className="button ghost logout-button" onClick={onLogout}>
            Log out
          </button>
        )}
      </aside>

      <div className="mobile-topbar">
        <div className="brand-title">
          <span className="brand-accent">AI</span> Middleware
        </div>
        <div className="mobile-actions">
          {onLogout && (
            <button className="button ghost" onClick={onLogout}>
              Log out
            </button>
          )}
          <button className="button ghost" onClick={() => setOpen(!open)}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={(e) => {
                e.preventDefault();
                requestLeave(item.to, true);
              }}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      <main className="content">{children}</main>

      {showLeave && (
        <div className="modal leave-modal">
          <div className="modal-content leave-dialog">
            <div className="modal-header">
              <h2>Leave Page?</h2>
            </div>
            <div className="modal-body">
              <p>Do you want to leave this page? Unsaved changes may be lost.</p>
            </div>
            <div className="modal-actions leave-actions">
              <button className="button ghost" onClick={cancelLeave}>
                Cancel
              </button>
              <button className="button" onClick={confirmLeave}>
                Leave Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
