import { useEffect, useState } from "react";
import type { AttributeSession } from "../api";
import { deleteAttributeSession, fetchAttributeSessions } from "../api";

type Props = {
  selectedAttributes: string[];
  availableAttributes: string[];
  onSaveAttributeSession: (selected: string[], available: string[], title: string, sessionId?: string | null) => Promise<AttributeSession>;
  onActivateSession: (sessionId: string) => Promise<void>;
  sessionTitle: string;
};

export default function MasterAttributeSessionPage({
  selectedAttributes,
  availableAttributes,
  onSaveAttributeSession,
  onActivateSession,
  sessionTitle,
}: Props) {
  // Ensure we never call string methods on undefined/null
  const initialTitle = sessionTitle ?? "";
  const [sessionSelection, setSessionSelection] = useState<string[]>(
    () => Array.from(new Set([...availableAttributes, ...selectedAttributes]))
  );
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedAttributes));
  const [savingSession, setSavingSession] = useState(false);
  const [manualAttribute, setManualAttribute] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttributeSession | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [sessions, setSessions] = useState<AttributeSession[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [createMode, setCreateMode] = useState(false);

  function sortSessions(list: AttributeSession[]) {
    return [...list].sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      // older first so newly saved appears below existing
      return aTime - bTime;
    });
  }

  useEffect(() => {
    // Only reset to active session when not editing a saved card
    if (editingSessionId || createMode) return;
    setSessionSelection(Array.from(new Set([...availableAttributes, ...selectedAttributes])));
    setChecked(new Set(selectedAttributes));
    setTitle(sessionTitle ?? "");
  }, [selectedAttributes, availableAttributes, sessionTitle, editingSessionId, createMode]);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoadingSessions(true);
      const list = await fetchAttributeSessions();
      const sorted = sortSessions(list);
      setSessions(sorted);
      const active = sorted.find((s) => s.is_active) || sorted[0];
      setActiveSessionId(active?._id || null);
      if (!editingSessionId && !createMode) {
        if (active) {
          setSessionSelection(Array.from(new Set([...(active.available_attributes || []), ...(active.selected_attributes || [])])));
          setChecked(new Set(active.selected_attributes || []));
          setTitle(active.session_title || "");
        } else {
          setSessionSelection([]);
          setChecked(new Set());
          setTitle("");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  }

  const sessionAttributes = Array.from(new Set(sessionSelection)).sort((a, b) => a.localeCompare(b));

  async function handleSaveSession() {
    const selected = sessionAttributes.filter((item) => checked.has(item));
    const sessionTitleValue = (title ?? "").trim();
    setSavingSession(true);
    try {
      const targetSessionId = createMode ? null : (editingSessionId ?? activeSessionId);
      const saved = await onSaveAttributeSession(selected, sessionAttributes, sessionTitleValue, targetSessionId);
      // Ensure the card shows the title we just entered even if backend omits it
      const normalizedSaved = { ...saved, session_title: saved.session_title ?? sessionTitleValue };
      // Optimistically update list so it appears immediately
      setSessions((prev) => sortSessions([...prev.filter((s) => s._id !== normalizedSaved._id), { ...normalizedSaved }]));
      setEditingSessionId(null);
      setCreateMode(false);
      setSessionSelection(Array.from(new Set([...(normalizedSaved.available_attributes || []), ...(normalizedSaved.selected_attributes || [])])));
      setChecked(new Set(normalizedSaved.selected_attributes || []));
      setTitle("");
      setManualAttribute("");
      setShowEditor(false);
      await loadSessions();
      alert("Session saved successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save attributes.";
      alert(message);
    } finally {
      setSavingSession(false);
    }
  }

  function handleAddManualAttribute() {
    const name = manualAttribute.trim();
    if (!name) {
      setManualError("Attribute name required.");
      return;
    }
    const exists = sessionSelection.some((item) => item.toLowerCase() === name.toLowerCase());
    if (exists) {
      setManualError("Attribute already added.");
      setManualAttribute("");
      return;
    }
    setSessionSelection((prev) => [...prev, name]);
    setChecked((prev) => new Set([...Array.from(prev), name]));
    setManualAttribute("");
    setManualError(null);
  }

  function handleRemoveAttribute(name: string) {
    setSessionSelection((prev) => prev.filter((item) => item !== name));
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }

  async function handleConfirmRemove() {
    if (!removeTarget) return;
    const updated = sessionSelection.filter((item) => item !== removeTarget);
    const nextChecked = new Set(checked);
    nextChecked.delete(removeTarget);
    if (createMode) {
      setSessionSelection(updated);
      setChecked(nextChecked);
      setRemoveTarget(null);
      setRemoveError(null);
      return;
    }
    const targetSessionId = editingSessionId ?? activeSessionId;
    if (!targetSessionId) {
      setRemoveError("Session id missing; please refresh and try again.");
      return;
    }
    setChecked(nextChecked);
    setSavingSession(true);
    setRemoveError(null);
    try {
      setSessionSelection(updated);
      const saved = await onSaveAttributeSession(Array.from(nextChecked), updated, (title ?? "").trim(), targetSessionId);
      const normalizedSaved = { ...saved, session_title: saved.session_title ?? (title ?? "").trim() };
      setSessions((prev) => sortSessions([...prev.filter((s) => s._id !== normalizedSaved._id), { ...normalizedSaved }]));
      await loadSessions();
      setRemoveTarget(null);
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : "Failed to remove attribute.");
    } finally {
      setSavingSession(false);
    }
  }

  async function handleConfirmDeleteSession() {
    if (!deleteTarget?._id) return;
    setSavingSession(true);
    setDeleteError(null);
    try {
      await deleteAttributeSession(deleteTarget._id);
      setSessions((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      if (editingSessionId === deleteTarget._id) {
        setEditingSessionId(null);
        setShowEditor(false);
      }
      setDeleteTarget(null);
      await loadSessions();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete session.");
    } finally {
      setSavingSession(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Master Attribute Session</h1>
          <p>Admin manually adds attributes. CSV output will show only these attributes.</p>
        </div>
      </section>

      {showEditor ? (
        <div className="card">
          <h2>{editingSessionId ? "Edit Session" : "Create Session"}</h2>
          <div className="field">
            <label>Session Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Default Import Profile"
            />
          </div>
          <div className="ops-form">
            <label>Manual Attribute</label>
            <div className="upload">
              <input
                value={manualAttribute}
                onChange={(e) => setManualAttribute(e.target.value)}
                placeholder="e.g. Brand or Weight"
              />
              <button className="button" onClick={handleAddManualAttribute} type="button">
                Add
              </button>
            </div>
            {manualError && <div className="error-text">{manualError}</div>}

            <label>Added Attributes</label>
            {sessionAttributes.length === 0 && <p className="muted">No attributes added yet.</p>}
            {sessionAttributes.map((name) => (
              <div key={name} className="upload">
                <div className="checkbox-row">
                  <input
                    type="checkbox"
                    aria-label={`Select ${name}`}
                    onChange={() =>
                      setChecked((prev) => {
                        const next = new Set(prev);
                        if (next.has(name)) next.delete(name);
                        else next.add(name);
                        return next;
                      })
                    }
                    checked={checked.has(name)}
                  />
                  <input value={name} readOnly />
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => setRemoveTarget(name)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="actions">
              <button className="button" onClick={handleSaveSession} disabled={savingSession}>
                {savingSession ? "Saving..." : "Save Session"}
              </button>
              {editingSessionId && (
                <button className="button ghost" type="button" onClick={() => { setEditingSessionId(null); setCreateMode(false); }} disabled={savingSession}>
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2>Create Session</h2>
            <p className="muted">Add a new session to manage attribute sets.</p>
          </div>
          <button
            className="button"
            type="button"
            onClick={() => {
              setShowEditor(true);
              setEditingSessionId(null);
              setCreateMode(true);
              setSessionSelection([]);
              setChecked(new Set());
              setTitle("");
              setManualAttribute("");
            }}
          >
            New Session
          </button>
        </div>
      )}

      <div className="card" style={{ marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Saved Sessions</h2>
          {loadingSessions && <span className="muted">Loading...</span>}
        </div>
        {sessions.length === 0 && <p className="muted">No sessions saved yet.</p>}
          <div className="attribute-grid single" style={{ gap: "12px" }}>
            {sessions.map((session) => (
              <div key={session._id} className="card" style={{ margin: 0, border: session.is_active ? "1px solid #4c84ff" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                  <div style={{ fontWeight: 600 }}>{session.session_title || "Untitled Session"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {session.selected_attributes?.length || 0} selected
                    {session.is_active ? " · Active" : ""}
                  </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => {
                        setShowEditor(true);
                        setEditingSessionId(session._id || null);
                        setCreateMode(false);
                        setSessionSelection(Array.from(new Set([...(session.available_attributes || []), ...(session.selected_attributes || [])])));
                        setChecked(new Set(session.selected_attributes || []));
                        setTitle(session.session_title || "");
                      }}
                  >
                    Edit
                  </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => {
                        if (!session._id) {
                          alert("Session id missing; please re-open this page and try again.");
                          return;
                        }
                        setDeleteTarget(session);
                        setDeleteError(null);
                      }}
                    >
                      Delete
                    </button>
                    <button
                      className="button"
                      type="button"
                      disabled={session.is_active}
                      onClick={async () => {
                        try {
                          // Refresh to make sure we have ids
                          await loadSessions();
                          const latest = sessions.find((s) => s.session_title === session.session_title) || session;
                          const targetId = latest._id;
                          if (!targetId) {
                            alert("Session id missing; please re-open this page and try again.");
                            return;
                          }
                          await onActivateSession(targetId);
                          await loadSessions();
                          alert(`${latest.session_title || "Session"} applied. It will be used for CSV imports.`);
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : "Failed to apply session.";
                          alert(msg);
                        }
                      }}
                    >
                      {session.is_active ? "Active" : "Apply"}
                    </button>
                  </div>
                </div>
              {session.selected_attributes?.length ? (
                <div className="attribute-values" style={{ marginTop: 8 }}>
                  {session.selected_attributes.slice(0, 6).map((attr) => (
                    <span key={attr} className="chip">
                      {attr}
                    </span>
                  ))}
                  {session.selected_attributes.length > 6 && (
                    <span className="chip muted">+{session.selected_attributes.length - 6} more</span>
                  )}
                </div>
              ) : (
                <div className="muted" style={{ marginTop: 8 }}>No attributes selected.</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {removeTarget && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Remove Attribute</h2>
              <button className="button ghost" onClick={() => setRemoveTarget(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>Do you want to remove `{removeTarget}` from session attributes?</p>
              {removeError && <div className="error-text">{removeError}</div>}
            </div>
            <div className="modal-actions">
              <button className="button ghost" onClick={() => setRemoveTarget(null)} disabled={savingSession}>
                Cancel
              </button>
              <button
                className="button danger"
                onClick={handleConfirmRemove}
                disabled={savingSession}
              >
                {savingSession ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Delete Session</h2>
              <button className="button ghost" onClick={() => setDeleteTarget(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>Do you want to delete "{deleteTarget.session_title || "Untitled Session"}"?</p>
              {deleteError && <div className="error-text">{deleteError}</div>}
            </div>
            <div className="modal-actions">
              <button className="button ghost" onClick={() => setDeleteTarget(null)} disabled={savingSession}>
                No
              </button>
              <button
                className="button danger"
                onClick={handleConfirmDeleteSession}
                disabled={savingSession}
              >
                {savingSession ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
