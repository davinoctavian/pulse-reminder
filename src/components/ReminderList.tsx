import type { Reminder } from "../interface/Reminder";
import HistoryModal from "./HistoryModal";

interface ReminderListProps {
  reminders: Reminder[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onSnooze: (index: number) => void;
  onStop: (index: number) => void;
}

function ReminderList({
  reminders,
  onEdit,
  onDelete,
  onSnooze,
  onStop,
}: ReminderListProps) {
  return (
    <div className="col s12">
      <div className="row list-reminder">
        {reminders.length === 0 ? (
          <p>No reminders yet</p>
        ) : (
          <ul className="collection">
            {reminders.map((reminder, index) => {
              if (!reminder.isRinging)
                return (
                  <li
                    key={index}
                    className="collection-item cyan accent-2 border-r10"
                    style={{ padding: "12px 16px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      {/* Alarm icon */}
                      <div
                        className="red"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <i className="material-icons white-text">
                          access_alarm
                        </i>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          className="blue-text text-darken-2"
                          style={{
                            fontWeight: 600,
                            fontSize: "16px",
                            display: "block",
                            marginBottom: "2px",
                          }}
                        >
                          {reminder.name}
                        </span>
                        <p
                          style={{ margin: "0 0 10px", fontSize: "13px" }}
                          className="blue-text text-darken-2"
                        >
                          Type: {reminder.type}{" "}
                          {reminder.base && `(${reminder.base})`}
                          <br />
                          {reminder.type === "consecutive" && (
                            <span>Every: {reminder.consecutiveTime} min</span>
                          )}
                          {reminder.type === "date" && (
                            <span>
                              Start: {reminder.startDate} at{" "}
                              {reminder.startTime}
                            </span>
                          )}
                        </p>

                        {/* Action buttons row — below text, no overflow */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <HistoryModal
                            reminderId={reminder.reminderId}
                            reminderName={reminder.name}
                          />
                          <a
                            href="#setting-modal"
                            data-tooltip="Details"
                            className="btn-floating tooltipped modal-trigger pulse cyan"
                            onClick={() => onEdit(index)}
                          >
                            <i className="material-icons">details</i>
                          </a>
                          <a
                            href="#!"
                            data-tooltip="Delete"
                            className="btn-floating tooltipped white"
                            onClick={() => onDelete(index)}
                          >
                            <i className="material-icons red-text">delete</i>
                          </a>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              else {
                return (
                  <li
                    key={index}
                    className="collection-item border-solid-white border-r10 transparent"
                    style={{ padding: "12px 16px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <a
                        href="#!"
                        data-tooltip="Snooze"
                        className="btn-floating btn-large tooltipped cyan pulse"
                        onClick={() => onSnooze(index)}
                        style={{ flexShrink: 0 }}
                      >
                        <i className="material-icons white-text">loop</i>
                      </a>

                      <span
                        className="white-text"
                        style={{
                          flex: 1,
                          fontWeight: 600,
                          fontSize: "16px",
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {reminder.name}
                      </span>

                      {/* Stop button */}
                      <a
                        href="#!"
                        data-tooltip="Stop"
                        className="btn-floating btn-large tooltipped pulse red"
                        onClick={() => onStop(index)}
                        style={{ flexShrink: 0 }}
                      >
                        <i className="material-icons white-text">close</i>
                      </a>
                    </div>
                  </li>
                );
              }
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ReminderList;
