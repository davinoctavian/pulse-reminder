import type { Reminder } from "../interface/Reminder";

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
                    className="collection-item avatar blue-text text-darken-2 cyan accent-2 border-r10"
                  >
                    <i className="material-icons circle red">access_alarm</i>
                    <span className="title">{reminder.name}</span>
                    <p>
                      Type : {reminder.type}{" "}
                      {reminder.base && `(${reminder.base})`} <br />
                      {reminder.type === "consecutive" && (
                        <span>Every : {reminder.consecutiveTime} min</span>
                      )}
                      {reminder.type === "date" && (
                        <span>
                          Start : {reminder.startDate} at {reminder.startTime}
                        </span>
                      )}
                    </p>
                    <div className="secondary-content">
                      <a
                        href="#setting-modal"
                        data-tooltip="Details"
                        className="btn-floating tooltipped modal-trigger pulse mr-5 cyan"
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
                  </li>
                );
              else {
                return (
                  <li
                    key={index}
                    className="collection-item white-text text-darken-2 transparent border-solid-white border-r10"
                  >
                    <a
                      href="#!"
                      data-tooltip="Snooze"
                      className="btn-floating btn-large tooltipped cyan pulse mr-5"
                      onClick={() => onSnooze(index)}
                    >
                      <i className="material-icons white-text">loop</i>
                    </a>
                    <span className="title">{reminder.name}</span>
                    <div className="secondary-content">
                      <a
                        href="#!"
                        data-tooltip="close"
                        className="btn-floating btn-large tooltipped pulse red"
                        onClick={() => onStop(index)}
                      >
                        <i className="material-icons">close</i>
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
