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
  const [selectedReminderIndex, setSelectedReminderIndex] = useState<
    number | null
  >(null);

  const handleSaveReminder = (newReminder: Reminder) => {
    if (selectedReminderIndex !== null) {
      setReminders((prev) =>
        prev.map((r, i) => (i === selectedReminderIndex ? newReminder : r)),
      );
    } else {
      setReminders((prev) => [...prev, newReminder]);
    }
    setSelectedReminderIndex(null);
  };

  const handleDeleteReminder = (index: number) => {
    setReminders((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const elems = document.querySelectorAll(".tooltipped");
    const modalElems = document.querySelectorAll(".modal");
    const selectElems = document.querySelectorAll("select");
    M.FormSelect.init(selectElems);
    M.Tooltip.init(elems);
    M.Modal.init(modalElems, {
      onOpenEnd: () => {
        M.updateTextFields();
      },
      onCloseEnd: () => {
        setSelectedReminderIndex(null);
      },
    });
  }, []);

  return (
    <div
      className="container valign-wrapper center-align"
      style={{ height: "100%" }}
    >
      <main className="row">
        <h3 className="col s12">Reminder</h3>
        <ReminderList
          reminders={reminders}
          onEdit={setSelectedReminderIndex}
          onDelete={handleDeleteReminder}
        />
      </main>
      <footer>
        <AddReminderButton />
      </footer>
      <Settings
        reminder={
          selectedReminderIndex !== null
            ? reminders[selectedReminderIndex]
            : undefined
        }
        onSave={handleSaveReminder}
      />
    </div>
  );
}

export default App;
