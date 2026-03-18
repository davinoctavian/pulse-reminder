import type { Reminder } from "../interface/Reminder";

interface ReminderListProps {
  reminders: Reminder[];
}

function ReminderList({ reminders }: ReminderListProps) {
  return (
    <div className="col s12">
      <div className="row list-reminder">
        {reminders.length === 0 ? (
          <p>No reminders yet</p>
        ) : (
          <ul className="collection">
            {reminders.map((reminder, index) => (
              // <div key={index} className="col s12 card-panel teal lighten-2">
              //   <strong>{reminder.type}</strong>
              //   {reminder.base && <p>Base: {reminder.base}</p>}
              //   {reminder.startDate && <p>Date: {reminder.startDate}</p>}
              //   {reminder.startTime && <p>Time: {reminder.startTime}</p>}
              //   {reminder.consecutiveTime && (
              //     <p>Timer: {reminder.consecutiveTime} min</p>
              //   )}
              //   {reminder.stopButton && <p>Stop Button: Enabled</p>}
              //   {reminder.stopTimerButton && <p>Stop Timer After Stop: Yes</p>}
              // </div>
              <li
                key={index}
                className="collection-item avatar blue-text text-darken-2 cyan accent-2"
              >
                <i className="material-icons circle red">play_arrow</i>
                <span className="title">{reminder.name}</span>
                <p>
                  {reminder.type} - {reminder.base} <br />
                  {reminder.consecutiveTime && (
                    <span>Timer: {reminder.consecutiveTime} min</span>
                  )}
                </p>
                <a href="#!" className="secondary-content">
                  <i className="material-icons">details</i>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ReminderList;
