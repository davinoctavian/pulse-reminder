import { useState, useEffect } from "react";
import "./App.css";
import M from "materialize-css";
import Settings from "./components/Settings";
import ReminderList from "./components/ReminderList";
import AddReminderButton from "./components/AddReminderButton";
import usePersistentState from "./hooks/usePersistentState";
import type { Reminder } from "./interface/Reminder";

function App() {
  const [reminders, setReminders] = usePersistentState<Reminder[]>(
    "reminders",
    [],
  );
  const [reminderName, setReminderName] = useState("");
  const [reminderType, setReminderType] = useState("");
  const [consecutiveBase, setConsecutiveBase] = useState("");
  const [stopButton, setStopButton] = useState(false);
  const [stopTimerButton, setStopTimerButton] = useState(false);
  const [dateReminder, setDateReminder] = useState("");
  const [timeReminder, setTimeReminder] = useState("");

  useEffect(() => {
    const elems = document.querySelectorAll(".tooltipped");
    const modalElems = document.querySelectorAll(".modal");
    const selectElems = document.querySelectorAll("select");
    M.FormSelect.init(selectElems);
    M.Tooltip.init(elems);
    M.Modal.init(modalElems);
  }, []);

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
        setDateReminder(date.toISOString().split("T")[0]);
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

  return (
    <div
      className="container valign-wrapper center-align"
      style={{ height: "100%" }}
    >
      <main className="row">
        <h3 className="col s12">Reminder</h3>
        <ReminderList reminders={reminders} />
      </main>
      <footer>
        <AddReminderButton />
      </footer>
      <Settings
        remindderName={reminderName}
        setReminderName={setReminderName}
        reminderType={reminderType}
        setReminderType={setReminderType}
        setConsecutiveBase={setConsecutiveBase}
        consecutiveBase={consecutiveBase}
        setStopButton={setStopButton}
        stopButton={stopButton}
        setStopTimerButton={setStopTimerButton}
        stopTimerButton={stopTimerButton}
        setReminders={setReminders}
        dateReminder={dateReminder}
        timeReminder={timeReminder}
        setDateReminder={setDateReminder}
        setTimeReminder={setTimeReminder}
      />
    </div>
  );
}

export default App;
