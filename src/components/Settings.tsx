import { useEffect, useState } from "react";
import type { Reminder } from "../interface/Reminder";
import ConsecutiveSettings from "./ConsecutiveSettings";
import ReminderTypeSelect from "./ReminderTypeSelect";

interface ReminderModalProps {
  remindderName: string;
  setReminderName: (val: string) => void;
  reminderType: string;
  setReminderType: (val: string) => void;
  consecutiveBase: string;
  setConsecutiveBase: (val: string) => void;
  stopButton: boolean;
  setStopButton: (val: boolean) => void;
  stopTimerButton: boolean;
  setStopTimerButton: (val: boolean) => void;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  dateReminder: string;
  timeReminder: string;
  setDateReminder: (val: string) => void;
  setTimeReminder: (val: string) => void;
}

function Settings({
  remindderName,
  setReminderName,
  reminderType,
  setReminderType,
  setConsecutiveBase,
  consecutiveBase,
  setStopButton,
  stopButton,
  setStopTimerButton,
  stopTimerButton,
  setReminders,
  dateReminder,
  timeReminder,
  setDateReminder,
  setTimeReminder,
}: ReminderModalProps) {
  const [consecutiveTime, setConsecutiveTime] = useState(0);

  useEffect(() => {
    setDateReminder("");
    setTimeReminder("");
    setConsecutiveTime(0);
    setConsecutiveBase("");
    setStopButton(false);
    setStopTimerButton(false);
  }, [reminderType]);

  useEffect(() => {
    setTimeReminder("");
    setDateReminder("");
    setConsecutiveTime(0);
    setStopButton(false);
    setStopTimerButton(false);
  }, [consecutiveBase]);

  const handleSave = () => {
    const newReminder: Reminder = {
      name: remindderName,
      type: reminderType,
      base: consecutiveBase,
      startDate:
        (document.getElementById("start_date") as HTMLInputElement)?.value ||
        undefined,
      startTime:
        (document.getElementById("start_time") as HTMLInputElement)?.value ||
        undefined,
      consecutiveTime: parseInt(
        (document.getElementById("consecutive_time") as HTMLInputElement)
          ?.value || "0",
      ),
      stopButton,
      stopTimerButton,
    };

    setReminders((prev) => [...prev, newReminder]);
  };

  const isValid: boolean = !!(
    (reminderType === "consecutive" &&
      consecutiveBase &&
      ((consecutiveBase === "time" && consecutiveTime && timeReminder) ||
        (consecutiveBase === "date" && dateReminder && timeReminder))) ||
    (reminderType === "date" && dateReminder && timeReminder)
  );

  return (
    <div id="setting-modal" className="modal">
      <div className="modal-content">
        <h4 className="color-dark mb-40">Set Reminder</h4>
        <div className="input-field col s12">
          <input
            id="reminder_name"
            type="text"
            value={remindderName}
            onChange={(e) => setReminderName(e.target.value)}
          />
          <label htmlFor="reminder_name">Name</label>
        </div>
        <ReminderTypeSelect
          reminderType={reminderType}
          setReminderType={setReminderType}
        />

        {reminderType === "consecutive" && (
          <ConsecutiveSettings
            consecutiveBase={consecutiveBase}
            setConsecutiveBase={setConsecutiveBase}
            stopButton={stopButton}
            setStopButton={setStopButton}
            stopTimerButton={stopTimerButton}
            setStopTimerButton={setStopTimerButton}
            setConsecutiveTime={setConsecutiveTime}
            setDateReminder={setDateReminder}
            setTimeReminder={setTimeReminder}
          />
        )}
        {reminderType === "date" && (
          <>
            <div className="input-field col s12">
              <input
                id="date_reminder"
                type="text"
                className="datepicker"
                onChange={(e) => setDateReminder(e.target.value)}
              />
              <label htmlFor="date_reminder">Date</label>
            </div>
            <div className="input-field col s12">
              <input
                id="time_reminder"
                type="text"
                className="timepicker"
                onChange={(e) => setTimeReminder(e.target.value)}
              />
              <label htmlFor="time_reminder">Time</label>
            </div>
          </>
        )}
      </div>
      <div className="modal-footer">
        <button
          onClick={handleSave}
          className={`modal-close waves-effect waves-light btn green ${
            !isValid ? "disabled" : ""
          }`}
          disabled={!isValid}
        >
          Save
        </button>
        <button className="modal-close waves-effect waves-light btn grey lighten-1">
          Close
        </button>
      </div>
    </div>
  );
}

export default Settings;
