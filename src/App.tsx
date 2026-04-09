import { useState, useEffect } from "react";
import "./App.css";
import M from "materialize-css";
import Settings from "./components/Settings";
import ReminderList from "./components/ReminderList";
import AddReminderButton from "./components/AddReminderButton";
import usePersistentState from "./hooks/usePersistentState";
import type { Reminder } from "./interface/Reminder";
import scheduleReminders from "./hooks/scheduleReminder";
import AlarmWorker from "./alarmWorker?worker";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

const worker = new AlarmWorker();
const platform = Capacitor.getPlatform();
let alarmAudio: HTMLAudioElement | null = null;

if (platform !== "web") {
  LocalNotifications.registerActionTypes({
    types: [
      {
        id: "REMINDER_ACTIONS",
        actions: [
          { id: "SNOOZE", title: "Snooze" },
          { id: "STOP", title: "Stop" },
        ],
      },
    ],
  });
}

function App() {
  const [reminders, setReminders] = usePersistentState<Reminder[]>(
    "reminders",
    [],
  );
  const [selectedReminderIndex, setSelectedReminderIndex] = useState<
    number | null
  >(null);

  const stopAlarmSound = () => {
    if (alarmAudio) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      alarmAudio = null;
    }
  };

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

  const handleSnoozeReminder = (index: number) => {
    const reminder = reminders[index];
    if (reminder) {
      const snoozedReminder = {
        ...reminder,
        startDate: new Date().toISOString().split("T")[0],
        startTime: new Date(
          Date.now() + 5 * 60 * 1000, // Snooze for 5 minutes
        )
          .toTimeString()
          .slice(0, 5),
        isRinging: false,
      };
      setReminders((prev) => {
        const updated = prev.map((r, i) => (i === index ? snoozedReminder : r));
        worker.postMessage({ type: "SET_REMINDERS", payload: updated });
        return updated;
      });
      stopAlarmSound();
    }
  };

  const handleStopReminder = (index: number) => {
    const reminder = reminders[index];
    if (reminder) {
      if (reminder.type === "consecutive" && reminder.startTime) {
        reminder.startDate = new Date().toISOString().split("T")[0];
        reminder.startTime = new Date(
          Date.now() + (reminder.consecutiveTime ?? 0) * 60 * 1000,
        )
          .toTimeString()
          .slice(0, 5);
      } else {
        const nextAlarm = new Date().setFullYear(new Date().getFullYear() + 1);
        reminder.startDate = new Date(nextAlarm).toISOString().split("T")[0];
      }
      const stoppedReminder = {
        ...reminder,
        isRinging: false,
      };
      setReminders((prev) =>
        prev.map((r, i) => (i === index ? stoppedReminder : r)),
      );
      stopAlarmSound();
    }
  };

  useEffect(() => {
    if (platform === "web") {
      worker.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === "TRIGGER_ALARM") {
          setReminders((prev) =>
            prev.map((r) =>
              r.name === payload.name ? { ...r, ...payload } : r,
            ),
          );

          if (Notification.permission === "granted") {
            const notification = new Notification("Reminder Alert", {
              body: `Reminder: ${payload.name}`,
              requireInteraction: true,
            });

            notification.onclick = () => {
              if (payload.alarmFile) {
                if (alarmAudio) {
                  alarmAudio.pause();
                  alarmAudio = null;
                }
                alarmAudio = new Audio(payload.alarmFile);
                alarmAudio.loop = true;
                alarmAudio.play();
              }
            };
          }
        }
      };
    }

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

  useEffect(() => {
    if (platform === "web") {
      worker.postMessage({ type: "SET_REMINDERS", payload: reminders });
    } else {
      scheduleReminders(reminders, setReminders);
    }
  }, [reminders]);

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
          onSnooze={handleSnoozeReminder}
          onStop={handleStopReminder}
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
