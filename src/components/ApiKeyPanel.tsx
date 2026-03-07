import { useState } from "react";

type Props = {
  onSaved: () => void;
};

export default function ApiKeyPanel({ onSaved }: Props) {
  const [key, setKey] = useState(localStorage.getItem("api_key") || "");

  function handleSave() {
    if (key.trim()) {
      localStorage.setItem("api_key", key.trim());
    } else {
      localStorage.removeItem("api_key");
    }
    onSaved();
  }

  return (
    <div className="card">
      <h2>API Key</h2>
      <div className="api-key-row">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter API key (optional)"
        />
        <button className="button" onClick={handleSave}>Save</button>
      </div>
      <div className="muted">If API_KEY is set on the backend, requests require this key.</div>
    </div>
  );
}
