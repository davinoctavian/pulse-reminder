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
  const [reminderType, setReminderType] = useState("");
  const [consecutiveBase, setConsecutiveBase] = useState("");
  const [stopButton, setStopButton] = useState(false);
  const [stopTimerButton, setStopTimerButton] = useState(false);

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
    });
    M.Timepicker.init(timeElems, {
      twelveHour: false,
      autoClose: true,
      container: "body",
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
        reminderType={reminderType}
        setReminderType={setReminderType}
        setConsecutiveBase={setConsecutiveBase}
        consecutiveBase={consecutiveBase}
        setStopButton={setStopButton}
        stopButton={stopButton}
        setStopTimerButton={setStopTimerButton}
        stopTimerButton={stopTimerButton}
        setReminders={setReminders}
      />
    </div>
  );
}

export default App;
