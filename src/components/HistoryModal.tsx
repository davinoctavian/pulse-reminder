import { useState, useEffect, useRef } from "react";
import M from "materialize-css";
import {
  getHistory,
  clearHistory,
  getHistoryForReminder,
  type HistoryEntry,
} from "../services/HistoryService";

interface HistoryModalProps {
  reminderName: string;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(start: number, end: number): string {
  const diff = Math.floor((end - start) / 1000);
  if (diff < 60) return `${diff}s`;
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${mins}m ${secs}s`;
}

const statusConfig: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  snoozed: { icon: "loop", color: "cyan", label: "Snoozed" },
  stopped: { icon: "stop", color: "red", label: "Stopped" },
  dismissed: { icon: "close", color: "orange", label: "Dismissed" },
  created: { icon: "add_circle", color: "green", label: "Created" },
  updated: { icon: "edit", color: "blue", label: "Updated" },
};

function HistoryModal({ reminderName }: HistoryModalProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalInstanceRef = useRef<M.Modal | null>(null);
  const modalId = `history-modal-${reminderName.replace(/\s+/g, "-")}`;

  // Initialize Materialize modal on mount and re-init when needed
  useEffect(() => {
    if (!modalRef.current) return;
    modalInstanceRef.current = M.Modal.init(modalRef.current, {
      onOpenStart: () => {
        loadHistory();
      },
    });
    return () => {
      modalInstanceRef.current?.destroy();
    };
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const all = await getHistory();
      setEntries(getHistoryForReminder(all, reminderName));
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    modalInstanceRef.current?.open();
  };

  const handleClear = async () => {
    await clearHistory();
    setEntries([]);
  };

  const handleClose = () => {
    modalInstanceRef.current?.close();
  };

  return (
    <>
      {/* Trigger button */}
      <a
        href="#!"
        data-tooltip="History"
        className="btn-floating tooltipped white mr-5"
        onClick={handleOpen}
      >
        <i className="material-icons cyan-text">history</i>
      </a>

      {/* Modal — mounted once, controlled via M.Modal instance */}
      <div id={modalId} ref={modalRef} className="modal modal-fixed-footer">
        <div className="modal-content" style={{ padding: 0 }}>
          {/* Header */}
          <div className="cyan darken-1" style={{ padding: "20px 24px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <i
                className="material-icons white-text"
                style={{ fontSize: "28px" }}
              >
                history
              </i>
              <div>
                <h5
                  className="white-text"
                  style={{ margin: 0, fontWeight: 600 }}
                >
                  History
                </h5>
                <p
                  className="white-text"
                  style={{ margin: 0, opacity: 0.8, fontSize: "13px" }}
                >
                  {reminderName}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ minHeight: "200px" }}>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "200px",
                }}
              >
                <div className="preloader-wrapper small active">
                  <div className="spinner-layer spinner-cyan-only">
                    <div className="circle-clipper left">
                      <div className="circle" />
                    </div>
                    <div className="gap-patch">
                      <div className="circle" />
                    </div>
                    <div className="circle-clipper right">
                      <div className="circle" />
                    </div>
                  </div>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "200px",
                  gap: "12px",
                  opacity: 0.5,
                }}
              >
                <i
                  className="material-icons grey-text"
                  style={{ fontSize: "48px" }}
                >
                  history_toggle_off
                </i>
                <p className="grey-text" style={{ margin: 0 }}>
                  No history yet
                </p>
              </div>
            ) : (
              <ul className="collection" style={{ margin: 0, border: "none" }}>
                {entries.map((entry, i) => {
                  const cfg =
                    statusConfig[entry.status] ?? statusConfig.dismissed;
                  const isAction = ["snoozed", "stopped", "dismissed"].includes(
                    entry.status,
                  );
                  return (
                    <li
                      key={i}
                      className="collection-item"
                      style={{ padding: "12px 24px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px",
                        }}
                      >
                        <div
                          className={`${cfg.color} darken-1`}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          <i
                            className="material-icons white-text"
                            style={{ fontSize: "18px" }}
                          >
                            {cfg.icon}
                          </i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              className={`${cfg.color}-text darken-1`}
                              style={{ fontWeight: 600, fontSize: "14px" }}
                            >
                              {cfg.label}
                            </span>
                            <span
                              className="grey-text"
                              style={{ fontSize: "11px" }}
                            >
                              {formatDate(entry.ringTime)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "16px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <span
                                className="grey-text"
                                style={{ fontSize: "11px" }}
                              >
                                {isAction ? "Started" : "At"}
                              </span>
                              <p
                                className="black-text"
                                style={{
                                  margin: 0,
                                  fontSize: "13px",
                                  fontWeight: 500,
                                }}
                              >
                                {formatTime(entry.ringTime)}
                              </p>
                            </div>
                            {isAction && (
                              <>
                                <div>
                                  <span
                                    className="grey-text"
                                    style={{ fontSize: "11px" }}
                                  >
                                    {entry.status === "snoozed"
                                      ? "Snoozed at"
                                      : "Stopped at"}
                                  </span>
                                  <p
                                    className="black-text"
                                    style={{
                                      margin: 0,
                                      fontSize: "13px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {formatTime(entry.offTime)}
                                  </p>
                                </div>
                                <div>
                                  <span
                                    className="grey-text"
                                    style={{ fontSize: "11px" }}
                                  >
                                    Duration
                                  </span>
                                  <p
                                    className="black-text"
                                    style={{
                                      margin: 0,
                                      fontSize: "13px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {formatDuration(
                                      entry.ringTime,
                                      entry.offTime,
                                    )}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {entries.length > 0 && (
            <a href="#!" className="btn-flat red-text" onClick={handleClear}>
              <i className="material-icons left">delete_sweep</i>
              Clear
            </a>
          )}
          <a href="#!" className="btn-flat cyan-text" onClick={handleClose}>
            Close
          </a>
        </div>
      </div>
    </>
  );
}

export default HistoryModal;
