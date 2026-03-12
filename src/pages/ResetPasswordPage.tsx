import { useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tokenPreview = useMemo(() => {
    if (!token) return "(missing token)";
    if (token.length <= 8) return token;
    return `${token.slice(0, 6)}…${token.slice(-6)}`;
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!token) {
      setError("Reset token missing. Please use the link from your email.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const msg = await resetPassword(token, password);
      setMessage(msg);
      setTimeout(() => navigate("/login", { replace: true }), 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to reset password";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-accent">AI</div>
          <div className="auth-title">Reset Password</div>
        </div>
        <p className="auth-subtitle">Use the link we sent to your email to set a new password.</p>
        <div className="auth-note">
          Token: <strong>{tokenPreview}</strong>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>
          <button className="button wide" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Update password"}
          </button>
        </form>
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-note success">{message}</div>}

        <div className="auth-footer">
          <Link className="text-link" to="/login">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
