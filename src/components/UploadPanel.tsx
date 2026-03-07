import { useRef, useState } from "react";
import { Supplier } from "../api";

type Props = {
  onUpload: (file: File) => Promise<void>;
  suppliers: Supplier[];
  onSelectSupplier: (supplierId: string) => void;
  selectedSupplier: string;
};

export default function UploadPanel({ onUpload, suppliers, onSelectSupplier, selectedSupplier }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      await onUpload(file);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Upload CSV</h2>
      <div className="upload">
        <select value={selectedSupplier} onChange={(e) => onSelectSupplier(e.target.value)}>
          <option value="">Select supplier</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
          ))}
        </select>
        <input ref={fileRef} type="file" accept=".csv,.xml" />
        <button className="button" onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
