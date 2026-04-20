import { LocalNotifications } from "@capacitor/local-notifications";
import type { Reminder } from "../interface/Reminder";
import NativeScheduler from "../nativeScheduler";
import type React from "react";

const channelMap: Record<string, string> = {
  "defaultalarm.wav": "ReminderDefault",
  "mealtime.wav": "ReminderMeal",
  "changediapers.wav": "ReminderDiapers",
  "takemedicine.wav": "ReminderMedicine",
};

function getNotificationId(reminderName: string): number {
  let hash = 0;
  for (let i = 0; i < reminderName.length; i++) {
    hash = (hash << 5) - hash + reminderName.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2_000_000_000 || 1;
}

function getNextDateTime(reminder: Reminder): Date | null {
  if (reminder.type === "date" && reminder.startDate && reminder.startTime) {
    return new Date(`${reminder.startDate}T${reminder.startTime}`);
  } else if (reminder.type === "consecutive" && reminder.startTime) {
    const [hours, minutes] = reminder.startTime.split(":").map(Number);
    const dt = new Date();
    dt.setHours(hours, minutes, 0, 0);
    return dt;
  }
  return null;
}

// Exported so App.tsx can call it directly from Snooze/Stop buttons
export async function scheduleOneReminder(reminder: Reminder, at: Date) {
  const id = getNotificationId(reminder.name);
  await NativeScheduler.cancel({ notificationId: id });
  await NativeScheduler.schedule({
    reminderName: reminder.name,
    reminderType: reminder.type,
    consecutiveTime: reminder.consecutiveTime ?? 0,
    snoozeTime: reminder.snoozeTime ?? 5,
    alarmFile: reminder.alarmFileName || "defaultalarm.wav",
    channelId: channelMap[reminder.alarmFileName || "defaultalarm.wav"],
    notificationId: id,
    triggerAtMillis: at.getTime(),
  });
}

// Exported so App.tsx can cancel when deleting a reminder
export async function cancelReminder(reminderName: string) {
  const id = getNotificationId(reminderName);
  await NativeScheduler.cancel({ notificationId: id });
}

let listenersInitialized = false;

export async function initNotificationListeners(
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
  ringingRef: React.MutableRefObject<Set<string>>,
) {
  if (listenersInitialized) return;
  listenersInitialized = true;

  await NativeScheduler.addListener("reminderUpdated", (data) => {
    ringingRef.current.delete(data.reminderName);
    setReminders((prev) =>
      prev.map((r) =>
        r.name === data.reminderName
          ? {
              ...r,
              startDate: data.nextDate,
              startTime: data.nextTime,
              isRinging: false,
            }
          : r,
      ),
    );
  });

  // Only updates isRinging for in-app UI — rescheduling is handled by ReminderReceiver.java
  await LocalNotifications.addListener(
    "localNotificationReceived",
    (notification) => {
      const reminderName = notification.body?.replace("Reminder: ", "");
      if (!reminderName) return;

      // Track that this reminder is ringing so scheduleReminders
      // useEffect in App.tsx doesn't needlessly re-schedule
      ringingRef.current.add(reminderName);

      setReminders((prev) =>
        prev.map((r) =>
          r.name === reminderName ? { ...r, isRinging: true } : r,
        ),
      );
    },
  );

  // Handles notification action buttons (Snooze / Stop) from the shade
  await LocalNotifications.addListener(
    "localNotificationActionPerformed",
    async (event) => {
      const { notification, actionId } = event;
      const reminderName = notification.body?.replace("Reminder: ", "");
      if (!reminderName) return;

      ringingRef.current.delete(reminderName);

      setReminders((prev) => {
        const reminder = prev.find((r) => r.name === reminderName);
        if (!reminder) return prev;

        let nextDate: string;
        let nextTime: string;

        if (actionId === "SNOOZE") {
          // Override ReminderReceiver's auto-reschedule
          const nextAt = new Date(
            Date.now() + (reminder.snoozeTime || 5) * 60 * 1000,
          );
          nextDate = nextAt.toISOString().split("T")[0];
          nextTime = nextAt.toTimeString().slice(0, 5);
          scheduleOneReminder(reminder, nextAt);
        } else if (actionId === "STOP") {
          if (reminder.type === "consecutive" && reminder.consecutiveTime) {
            // ReminderReceiver already scheduled next consecutive correctly
            const nextAt = new Date(
              Date.now() + reminder.consecutiveTime * 60 * 1000,
            );
            nextDate = nextAt.toISOString().split("T")[0];
            nextTime = nextAt.toTimeString().slice(0, 5);
            // No scheduleOneReminder call — ReminderReceiver's schedule is correct
          } else {
            // Date type — push to next year, cancel ReminderReceiver's next-day reschedule
            const nextAt = new Date();
            nextAt.setFullYear(nextAt.getFullYear() + 1);
            if (reminder.startTime) {
              const [h, m] = reminder.startTime.split(":").map(Number);
              nextAt.setHours(h, m, 0, 0);
            }
            nextDate = nextAt.toISOString().split("T")[0];
            nextTime = nextAt.toTimeString().slice(0, 5);
            scheduleOneReminder(
              { ...reminder, startDate: nextDate, startTime: nextTime },
              nextAt,
            );
          }
        } else {
          // Tapped notification body — snooze
          const nextAt = new Date(
            Date.now() + (reminder.snoozeTime || 5) * 60 * 1000,
          );
          nextDate = nextAt.toISOString().split("T")[0];
          nextTime = nextAt.toTimeString().slice(0, 5);
          scheduleOneReminder(reminder, nextAt);
        }

        return prev.map((r) =>
          r.name === reminderName
            ? {
                ...r,
                startDate: nextDate,
                startTime: nextTime,
                isRinging: false,
              }
            : r,
        );
      });
    },
  );
}

// Schedules initial/first occurrence only — ReminderReceiver handles subsequent ones
export default async function scheduleReminders(reminders: Reminder[]) {
  await LocalNotifications.requestPermissions();

  const now = Date.now();
  for (const reminder of reminders) {
    const dt = getNextDateTime(reminder);
    if (!dt) continue;

    let scheduleAt: Date;
    if (dt.getTime() <= now) {
      if (reminder.type === "consecutive" && reminder.consecutiveTime) {
        scheduleAt = new Date(now + reminder.consecutiveTime * 60 * 1000);
      } else {
        scheduleAt = new Date();
        scheduleAt.setDate(scheduleAt.getDate() + 1);
        if (reminder.startTime) {
          const [h, m] = reminder.startTime.split(":").map(Number);
          scheduleAt.setHours(h, m, 0, 0);
        }
      }
    } else {
      scheduleAt = dt;
    }

    await scheduleOneReminder(reminder, scheduleAt);
  }
}
