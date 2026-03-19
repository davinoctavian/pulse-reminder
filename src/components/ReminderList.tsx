import type { Reminder } from "../interface/Reminder";

interface ReminderListProps {
  reminders: Reminder[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

function ReminderList({ reminders, onEdit, onDelete }: ReminderListProps) {
  return (
    <div className="col s12">
      <div className="row list-reminder">
        {reminders.length === 0 ? (
          <p>No reminders yet</p>
        ) : (
          <ul className="collection">
            {reminders.map((reminder, index) => (
              <li
                key={index}
                className="collection-item avatar blue-text text-darken-2 cyan accent-2"
              >
                <i className="material-icons circle red">play_arrow</i>
                <span className="title">{reminder.name}</span>
                <p>
                  Type : {reminder.type} {reminder.base && `(${reminder.base})`}{" "}
                  <br />
                  {reminder.type === "consecutive" && (
                    <span>Every : {reminder.consecutiveTime} min</span>
                  )}
                  {reminder.type === "date" && (
                    <span>
                      Start : {reminder.startDate} at {reminder.startTime}
                    </span>
                  )}
                </p>
                <div className="secondary-content ">
                  <a
                    href="#setting-modal"
                    data-tooltip="Details"
                    className="tooltipped modal-trigger"
                    onClick={() => onEdit(index)}
                  >
                    <i className="material-icons">details</i>
                  </a>
                  <br />
                  <a
                    href="#!"
                    data-tooltip="Delete"
                    className="tooltipped"
                    onClick={() => onDelete(index)}
                  >
                    <i className="material-icons red-text">delete</i>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ReminderList;
