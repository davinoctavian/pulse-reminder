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
      const snoozeAt = new Date(Date.now() + 5 * 60 * 1000);
      const snoozedReminder = {
        ...reminder,
        startDate: snoozeAt.toISOString().split("T")[0],
        startTime: snoozeAt.toTimeString().slice(0, 5),
        isRinging: false,
      };
      setReminders((prev) => {
        const updated = prev.map((r, i) => (i === index ? snoozedReminder : r));
        if (platform === "web") {
          worker.postMessage({ type: "SET_REMINDERS", payload: updated });
        }
        return updated;
      });
      if (platform === "web") {
        stopAlarmSound();
      }
    }
  };

  const handleStopReminder = (index: number) => {
    const reminder = reminders[index];
    if (reminder) {
      let nextDate: string;
      let nextTime: string;

      if (reminder.type === "consecutive" && reminder.consecutiveTime) {
        const nextAt = new Date(
          Date.now() + reminder.consecutiveTime * 60 * 1000,
        );
        nextDate = nextAt.toISOString().split("T")[0];
        nextTime = nextAt.toTimeString().slice(0, 5);
      } else {
        const nextAt = new Date();
        nextAt.setFullYear(nextAt.getFullYear() + 1);
        nextDate = nextAt.toISOString().split("T")[0];
        nextTime = reminder.startTime ?? nextAt.toTimeString().slice(0, 5);
      }

      const stoppedReminder = {
        ...reminder,
        startDate: nextDate,
        startTime: nextTime,
        isRinging: false,
      };
      setReminders((prev) =>
        prev.map((r, i) => (i === index ? stoppedReminder : r)),
      );
      if (platform === "web") {
        stopAlarmSound();
      }
    }
  };

  // Web worker listener — runs once on mount
  useEffect(() => {
    if (platform !== "web") return;

    worker.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "TRIGGER_ALARM") {
        setReminders((prev) =>
          prev.map((r) => (r.name === payload.name ? { ...r, ...payload } : r)),
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
  }, []);

  // Materialize init — runs once on mount
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

  // Schedule reminders whenever the list changes
  useEffect(() => {
    if (platform === "web") {
      worker.postMessage({ type: "SET_REMINDERS", payload: reminders });
    } else {
      // scheduleReminders handles cancelling pending + rescheduling cleanly
      // and registers the action listener only once internally
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
