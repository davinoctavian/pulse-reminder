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
import { addHistory } from "./services/HistoryService";

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
  const selectedReminderIndexRef = useRef<number | null>(null);
  const [selectedReminderIndex, _setSelectedReminderIndex] = useState<
    number | null
  >(null);
  const setSelectedReminderIndex = (index: number | null) => {
    selectedReminderIndexRef.current = index;
    _setSelectedReminderIndex(index);
  };

  const ringingRef = useRef<Set<string>>(new Set());
  // Track ring start times for web history
  const ringStartRef = useRef<Record<string, number>>({});
  const settingsResetRef = useRef<(() => void) | null>(null);

  const stopAlarmSound = () => {
    if (alarmAudio) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      alarmAudio = null;
    }
  };

  const handleSaveReminder = (newReminder: Reminder) => {
    const isUpdate = selectedReminderIndex !== null;
    const now = Date.now();

    if (isUpdate) {
      const oldReminder = reminders[selectedReminderIndex!];
      const diff = getReminderDiff(oldReminder, newReminder);
      const updatedReminder = {
        ...newReminder,
        reminderId: oldReminder.reminderId,
      };

      setReminders((prev) =>
        prev.map((r, i) => (i === selectedReminderIndex ? updatedReminder : r)),
      );

      addHistory({
        reminderId: oldReminder.reminderId,
        reminderName: newReminder.name,
        status: "updated",
        ringTime: now,
        offTime: now,
        detail: diff,
      });
    } else {
      const reminderId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newWithId = { ...newReminder, reminderId };
      setReminders((prev) => [...prev, newWithId]);

      addHistory({
        reminderId: reminderId,
        reminderName: newReminder.name,
        status: "created",
        ringTime: now,
        offTime: now,
        detail: `Start: ${newReminder.type === "date" ? newReminder.startDate : newReminder?.base == "date" ? newReminder.startDate : ""} ${newReminder.startTime}, Type: ${newReminder.type}${newReminder.type === "consecutive" && newReminder.base === "time" ? `, Every ${newReminder.consecutiveTime}min` : newReminder.type === "consecutive" && newReminder.base === "date" ? ", Every Day" : ""}${newReminder.snoozeTime ? `, Snooze ${newReminder.snoozeTime}min` : ""}`,
      });
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
      scheduleOneReminder(snoozedReminder, snoozeAt);
    } else {
      // Save history for web
      const ringTime = ringStartRef.current[reminder.name] ?? Date.now();
      addHistory({
        reminderId: reminder.reminderId,
        reminderName: reminder.name,
        status: "snoozed",
        ringTime,
        offTime: Date.now(),
      });
      delete ringStartRef.current[reminder.name];

      // Tell worker about snooze for its own history tracking
      worker.postMessage({ type: "SNOOZE", payload: { name: reminder.name } });
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
      scheduleOneReminder(stoppedReminder, nextAt);
    } else {
      // Save history for web
      const ringTime = ringStartRef.current[reminder.name] ?? Date.now();
      addHistory({
        reminderId: reminder.reminderId,
        reminderName: reminder.name,
        status: "stopped",
        ringTime,
        offTime: Date.now(),
      });
      delete ringStartRef.current[reminder.name];

      worker.postMessage({ type: "STOP", payload: { name: reminder.name } });
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

  const getReminderDiff = (
    oldReminder: Reminder,
    newReminder: Reminder,
  ): string => {
    const changes: string[] = [];

    if (oldReminder.name !== newReminder.name)
      changes.push(`Name: "${oldReminder.name}" → "${newReminder.name}"`);

    if (oldReminder.type !== newReminder.type)
      changes.push(`Type: ${oldReminder.type} → ${newReminder.type}`);

    if (oldReminder.startDate !== newReminder.startDate)
      changes.push(`Date: ${oldReminder.startDate} → ${newReminder.startDate}`);

    if (oldReminder.startTime !== newReminder.startTime)
      changes.push(`Time: ${oldReminder.startTime} → ${newReminder.startTime}`);

    if (oldReminder.consecutiveTime !== newReminder.consecutiveTime)
      changes.push(
        `Interval: ${oldReminder.consecutiveTime}min → ${newReminder.consecutiveTime}min`,
      );

    if (oldReminder.snoozeTime !== newReminder.snoozeTime)
      changes.push(
        `Snooze: ${oldReminder.snoozeTime ?? 5}min → ${newReminder.snoozeTime ?? 5}min`,
      );

    if (oldReminder.alarmFileName !== newReminder.alarmFileName)
      changes.push(
        `Sound: ${oldReminder.alarmFileName ?? "default"} → ${newReminder.alarmFileName ?? "default"}`,
      );

    return changes.length > 0 ? changes.join(", ") : "No changes";
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

      CapApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) syncScheduledTimes();
      });

      syncScheduledTimes();
      return;
    }

    // Web worker message handler
    worker.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "TRIGGER_ALARM") {
        // Track ring start time
        ringStartRef.current[payload.name] = Date.now();

        // Update reminder state with next scheduled time
        setReminders((prev) =>
          prev.map((r) =>
            r.name === payload.name
              ? {
                  ...r,
                  isRinging: true,
                }
              : r,
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
  }, []);

  // Materialize init — runs once on mount
  useEffect(() => {
    const elems = document.querySelectorAll(".tooltipped");
    const modalElems = document.querySelectorAll(".modal");
    const selectElems = document.querySelectorAll("select");
    M.FormSelect.init(selectElems);
    M.Tooltip.init(elems);
    M.Modal.init(modalElems, {
      onOpenStart: (modal: Element) => {
        if (
          modal.id === "setting-modal" &&
          selectedReminderIndexRef.current === null
        ) {
          settingsResetRef.current?.();
        }
      },
      onOpenEnd: () => M.updateTextFields(),
      onCloseEnd: () => {
        setSelectedReminderIndex(null);
      },
    });
  }, []);

  useEffect(() => {
    if (platform === "web") {
      worker.postMessage({ type: "SET_REMINDERS", payload: reminders });
      return;
    }

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
        onResetRef={settingsResetRef}
      />
    </div>
  );
}

export default App;
