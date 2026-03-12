import { FormEvent, useState } from "react";
import { requestPasswordReset } from "../api";

type Props = {
  onLogin: (username: string, password: string) => Promise<void> | void;
};

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    setResetMessage(null);
    setResetError(null);
    if (!resetEmail.trim()) {
      setResetError("Please enter your admin email.");
      return;
    }
    setResetLoading(true);
    try {
      const msg = await requestPasswordReset(resetEmail.trim());
      setResetMessage(msg);
      setResetEmail("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send reset email";
      setResetError(message);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-accent">AI</div>
          <div className="auth-title">Middleware Admin</div>
        </div>
        <p className="auth-subtitle">Secure access for administrators only.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="button wide" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="text-link"
            onClick={() => setShowReset((v) => !v)}
          >
            Forgot password?
          </button>
        </div>

        {showReset && (
          <form className="auth-reset" onSubmit={handleReset}>
            <div className="field">
              <label htmlFor="reset-email">Admin email</label>
              <input
                id="reset-email"
                type="email"
                placeholder="admin123@gmail.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <button className="button wide" type="submit" disabled={resetLoading}>
              {resetLoading ? "Sending..." : "Send reset link"}
            </button>
            {resetError && <div className="auth-error">{resetError}</div>}
            {resetMessage && <div className="auth-note">{resetMessage}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
