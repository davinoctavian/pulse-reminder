import { useEffect, useRef, useState } from "react";
import type { Reminder } from "../interface/Reminder";
import ConsecutiveSettings from "./ConsecutiveSettings";
import ReminderTypeSelect from "./ReminderTypeSelect";
import useFileToBase64 from "../hooks/useFileToBase64";
import defaultAlarm from "../assets/sound/defaultalarm.wav";
import { Capacitor } from "@capacitor/core";

const platform = Capacitor.getPlatform();

interface ReminderModalProps {
  reminder?: Reminder;
  onSave: (reminder: Reminder) => void;
}

function Settings({ reminder, onSave }: ReminderModalProps) {
  const [reminderName, setReminderName] = useState(reminder?.name || "");
  const [reminderType, setReminderType] = useState(reminder?.type || "");
  const [consecutiveBase, setConsecutiveBase] = useState(reminder?.base || "");
  const [dateReminder, setDateReminder] = useState(reminder?.startDate || "");
  const [timeReminder, setTimeReminder] = useState(reminder?.startTime || "");
  const [consecutiveTime, setConsecutiveTime] = useState(
    reminder?.consecutiveTime || 0,
  );
  const [snoozeTime, setSnoozeTime] = useState(reminder?.snoozeTime || 5);
  const [alarmFile, setAlarmFile] = useState<string>(defaultAlarm);
  const [alarmFileName, setAlarmFileName] = useState<string>(
    reminder?.alarmFileName || platform === "web"
      ? "Default Alarm"
      : "defaultalarm.wav",
  );
  const justOpened = useRef(false);

  useEffect(() => {
    if (reminder) {
      setReminderName(reminder.name || "");
      setReminderType(reminder.type || "");
      setConsecutiveBase(reminder.base || "");
      setDateReminder(reminder.startDate || "");
      setTimeReminder(reminder.startTime || "");
      setConsecutiveTime(reminder.consecutiveTime || 0);
      setSnoozeTime(reminder.snoozeTime || 5);
      setAlarmFile(reminder.alarmFile || defaultAlarm);
      if (platform !== "web") {
        setAlarmFileName(reminder.alarmFileName || "defaultalarm.wav");
      } else {
        setAlarmFileName(reminder.alarmFileName || "Default Alarm");
      }
    } else {
      setReminderName("");
      setReminderType("");
      setConsecutiveBase("");
      setDateReminder("");
      setTimeReminder("");
      setConsecutiveTime(0);
      setSnoozeTime(5);
      setAlarmFile(defaultAlarm);
      if (platform !== "web") {
        setAlarmFileName("defaultalarm.wav");
      } else {
        setAlarmFileName("Default Alarm");
      }
    }
    justOpened.current = true;
  }, [reminder]);

  useEffect(() => {
    if (justOpened.current) {
      justOpened.current = false;
      return;
    }

    if (reminderType === "date") {
      setConsecutiveBase("");
      setConsecutiveTime(0);
      setDateReminder("");
      setTimeReminder("");
    } else if (reminderType === "consecutive") {
      setDateReminder("");
      setTimeReminder("");
    } else {
      setDateReminder("");
      setTimeReminder("");
      setConsecutiveBase("");
      setConsecutiveTime(0);
    }
  }, [reminderType]);

  useEffect(() => {
    const selectElems = document.querySelectorAll("select");
    M.FormSelect.init(selectElems);

    const dateElems = document.querySelectorAll(".datepicker");
    const timeElems = document.querySelectorAll(".timepicker");
    M.Datepicker.init(dateElems, {
      format: "yyyy-mm-dd",
      autoClose: true,
      container: document.body,
      onSelect: (date: Date) => {
        setDateReminder(date.toLocaleDateString("en-CA"));
      },
    });
    M.Timepicker.init(timeElems, {
      twelveHour: false,
      autoClose: true,
      container: "body",
      onCloseEnd: () => {
        let val = "";
        if (consecutiveBase === "time") {
          val = (
            document.getElementById("start_time_ontime") as HTMLInputElement
          )?.value;
        } else if (consecutiveBase === "date") {
          val = (
            document.getElementById("start_time_ondate") as HTMLInputElement
          )?.value;
        } else {
          val = (document.getElementById("time_reminder") as HTMLInputElement)
            ?.value;
        }
        if (val) setTimeReminder(val);
      },
    });
  }, [reminderType, consecutiveBase]);

  const handleSave = () => {
    let valTime = "";
    if (consecutiveBase === "time") {
      valTime = (
        document.getElementById("start_time_ontime") as HTMLInputElement
      )?.value;
    } else if (consecutiveBase === "date") {
      valTime = (
        document.getElementById("start_time_ondate") as HTMLInputElement
      )?.value;
    } else {
      valTime = (document.getElementById("time_reminder") as HTMLInputElement)
        ?.value;
    }
    let valDate = "";
    if (reminderType === "date") {
      valDate = (document.getElementById("date_reminder") as HTMLInputElement)
        ?.value;
    } else {
      valDate = (document.getElementById("start_date") as HTMLInputElement)
        ?.value;
    }
    const newReminder: Reminder = {
      name: reminderName,
      type: reminderType,
      base: consecutiveBase,
      startDate: valDate,
      startTime: valTime,
      consecutiveTime: parseInt(
        (document.getElementById("consecutive_time") as HTMLInputElement)
          ?.value || "0",
      ),
      snoozeTime: snoozeTime,
      alarmFile,
      alarmFileName: alarmFileName || undefined,
      isRinging: false,
    };
    onSave(newReminder);
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
            value={reminderName}
            onChange={(e) => setReminderName(e.target.value)}
          />
          <label htmlFor="reminder_name">Name</label>
        </div>
        <ReminderTypeSelect
          reminderType={reminderType}
          setReminderType={setReminderType}
        />
        <div className="file-field input-field col s12">
          {platform === "web" && (
            <>
              <div className="btn">
                <span>Alarm Sound</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const base64 = await useFileToBase64(file);
                      setAlarmFile(base64);
                      setAlarmFileName(file.name);
                    } else {
                      setAlarmFile(defaultAlarm);
                      setAlarmFileName("Default Alarm");
                    }
                  }}
                />
              </div>
              <div className="file-path-wrapper">
                <input
                  name="alarm_file"
                  className="file-path validate"
                  type="text"
                  readOnly
                  value={alarmFileName || ""}
                  placeholder="No file chosen"
                />
              </div>
            </>
          )}
          {platform !== "web" && (
            <div className="input-field col s12">
              <select
                value={alarmFileName}
                onChange={(e) => setAlarmFileName(e.target.value)}
              >
                <option value="defaultalarm.wav">Default</option>
                <option value="mealtime.wav">Meal Time</option>
                <option value="changediapers.wav">Diapers Change</option>
                <option value="takemedicine.wav">Medicine Time</option>
              </select>
              <label>Alarm Sound</label>
            </div>
          )}
        </div>

        {reminderType === "consecutive" && (
          <ConsecutiveSettings
            consecutiveBase={consecutiveBase}
            consecutiveTime={consecutiveTime}
            startDate={dateReminder}
            startTime={timeReminder}
            setConsecutiveBase={setConsecutiveBase}
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
                value={dateReminder}
                onChange={(e) => setDateReminder(e.target.value)}
              />
              <label htmlFor="date_reminder">Date</label>
            </div>
            <div className="input-field col s12">
              <input
                id="time_reminder"
                type="text"
                className="timepicker"
                value={timeReminder}
                onChange={(e) => setTimeReminder(e.target.value)}
              />
              <label htmlFor="time_reminder">Time</label>
            </div>
          </>
        )}
        <div className="input-field col s12">
          <input
            id="snooze_time"
            type="number"
            value={snoozeTime || ""}
            onChange={(e) => setSnoozeTime(parseInt(e.target.value) || 0)}
          />
          <label htmlFor="snooze_time">Snooze (minutes)</label>
        </div>
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
        <button className="modal-close waves-effect waves-light btn red lighten-1">
          Close
        </button>
      </div>
    </div>
  );
}

export default Settings;
