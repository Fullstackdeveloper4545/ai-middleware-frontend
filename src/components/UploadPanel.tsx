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
  const [showPopup, setShowPopup] = useState(false);
  const [popupStep, setPopupStep] = useState<"confirm" | "processing" | "result">("confirm");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupIsError, setPopupIsError] = useState(false);

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a CSV/XML file.");
      return;
    }
    if (!selectedSupplier) {
      setError("Please select supplier first.");
      return;
    }
    setError(null);
    setPopupStep("confirm");
    setPopupMessage(`Upload "${file.name}" for selected supplier?`);
    setPopupIsError(false);
    setShowPopup(true);
  }

  async function confirmUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setPopupStep("result");
      setPopupMessage("File not found. Please select again.");
      setPopupIsError(true);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setPopupStep("processing");
      setPopupMessage("Uploading and processing file...");
      setPopupIsError(false);
      await onUpload(file);
      if (fileRef.current) fileRef.current.value = "";
      setPopupStep("result");
      setPopupMessage("Upload started successfully. You can track status in Import History.");
      setPopupIsError(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      setPopupStep("result");
      setPopupMessage(message);
      setPopupIsError(true);
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

      {showPopup && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>CSV Upload</h2>
              {popupStep !== "processing" && (
                <button className="button ghost" onClick={() => setShowPopup(false)}>
                  Close
                </button>
              )}
            </div>
            <div className="modal-body">
              <p className={popupIsError ? "error-text" : "muted"}>{popupMessage}</p>
            </div>
            <div className="modal-actions">
              {popupStep === "confirm" && (
                <>
                  <button className="button ghost" onClick={() => setShowPopup(false)}>
                    Cancel
                  </button>
                  <button className="button" onClick={confirmUpload} disabled={loading}>
                    Confirm Upload
                  </button>
                </>
              )}
              {popupStep === "result" && (
                <button className="button" onClick={() => setShowPopup(false)}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
