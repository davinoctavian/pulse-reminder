import { useState, useEffect, useRef } from "react";
import "./App.css";
import M from "materialize-css";
import Settings from "./components/Settings";
import ReminderList from "./components/ReminderList";
import AddReminderButton from "./components/AddReminderButton";
import usePersistentState from "./hooks/usePersistentState";
import type { Reminder } from "./interface/Reminder";
import scheduleReminders, {
  initNotificationListeners,
  cancelReminder,
  scheduleOneReminder,
} from "./hooks/scheduleReminder";
import AlarmWorker from "./alarmWorker?worker";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import NativeScheduler from "./nativeScheduler";

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

  // Track which reminder names are currently ringing so we
  // can skip re-scheduling when only isRinging changes
  const ringingRef = useRef<Set<string>>(new Set());

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
    const reminder = reminders[index];
    if (reminder && platform !== "web") {
      cancelReminder(reminder.name);
    }
    setReminders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSnoozeReminder = (index: number) => {
    const reminder = reminders[index];
    if (!reminder) return;

    const snoozeAt = new Date(
      Date.now() + (reminder.snoozeTime || 5) * 60 * 1000,
    );
    const nextDate = snoozeAt.toISOString().split("T")[0];
    const nextTime = snoozeAt.toTimeString().slice(0, 5);

    const snoozedReminder: Reminder = {
      ...reminder,
      startDate: nextDate,
      startTime: nextTime,
      isRinging: false,
    };

    ringingRef.current.delete(reminder.name);

    if (platform !== "web") {
      // Override the auto-rescheduled alarm from ReminderReceiver with snooze time
      scheduleOneReminder(snoozedReminder, snoozeAt);
    }

    setReminders((prev) => {
      const updated = prev.map((r, i) => (i === index ? snoozedReminder : r));
      if (platform === "web") {
        worker.postMessage({ type: "SET_REMINDERS", payload: updated });
        stopAlarmSound();
      }
      return updated;
    });
  };

  const handleStopReminder = (index: number) => {
    const reminder = reminders[index];
    if (!reminder) return;

    let nextDate: string;
    let nextTime: string;
    let nextAt: Date;

    if (reminder.type === "consecutive" && reminder.consecutiveTime) {
      nextAt = new Date(Date.now() + reminder.consecutiveTime * 60 * 1000);
      nextDate = nextAt.toISOString().split("T")[0];
      nextTime = nextAt.toTimeString().slice(0, 5);
    } else {
      nextAt = new Date();
      nextAt.setFullYear(nextAt.getFullYear() + 1);
      nextDate = nextAt.toISOString().split("T")[0];
      nextTime = reminder.startTime ?? nextAt.toTimeString().slice(0, 5);
    }

    const stoppedReminder: Reminder = {
      ...reminder,
      startDate: nextDate,
      startTime: nextTime,
      isRinging: false,
    };

    ringingRef.current.delete(reminder.name);

    if (platform !== "web") {
      // Override auto-rescheduled alarm with correct next time
      scheduleOneReminder(stoppedReminder, nextAt);
    }

    setReminders((prev) => {
      const updated = prev.map((r, i) => (i === index ? stoppedReminder : r));
      if (platform === "web") {
        worker.postMessage({ type: "SET_REMINDERS", payload: updated });
        stopAlarmSound();
      }
      return updated;
    });
  };

  // Init listeners + web worker — runs once on mount
  useEffect(() => {
    if (platform !== "web") {
      initNotificationListeners(setReminders, ringingRef);
      const syncScheduledTimes = async () => {
        try {
          const scheduled = await NativeScheduler.getScheduledTimes();
          setReminders((prev) =>
            prev.map((r) => {
              const nextDate = scheduled[r.name + "_date"];
              const nextTime = scheduled[r.name + "_time"];
              if (nextDate && nextTime) {
                return {
                  ...r,
                  startDate: nextDate,
                  startTime: nextTime,
                  isRinging: false,
                };
              }
              return r;
            }),
          );
        } catch (e) {
          console.error("Failed to sync scheduled times", e);
        }
      };

      // Sync on app resume (coming back from background)
      CapApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) syncScheduledTimes();
      });

      // Also sync immediately on mount
      syncScheduledTimes();
      return;
    }
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
      onOpenEnd: () => M.updateTextFields(),
      onCloseEnd: () => setSelectedReminderIndex(null),
    });
  }, []);

  // Only reschedule when reminders actually change (not just isRinging toggling)
  useEffect(() => {
    if (platform === "web") {
      worker.postMessage({ type: "SET_REMINDERS", payload: reminders });
      return;
    }

    // Skip if the only change was isRinging flipping — ReminderReceiver handles that
    const hasNonRingingChange = reminders.some(
      (r) => !ringingRef.current.has(r.name) || !r.isRinging,
    );
    if (hasNonRingingChange) {
      scheduleReminders(reminders);
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
