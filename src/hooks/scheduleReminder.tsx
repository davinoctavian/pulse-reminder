import { LocalNotifications } from "@capacitor/local-notifications";
import type { Reminder } from "../interface/Reminder";

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

async function scheduleOne(reminder: Reminder, at: Date) {
  const id = getNotificationId(reminder.name);
  await LocalNotifications.cancel({ notifications: [{ id }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title: "Reminder Alert",
        body: `Reminder: ${reminder.name}`,
        schedule: { at },
        sound: reminder.alarmFileName || "defaultalarm.wav",
        channelId: channelMap[reminder.alarmFileName || "defaultalarm.wav"],
        actionTypeId: "REMINDER_ACTIONS",
      },
    ],
  });
}

let actionListenerRegistered = false;
let actionListenerHandle: { remove: () => void } | null = null;

export async function cancelReminder(reminderName: string) {
  const id = getNotificationId(reminderName);
  await LocalNotifications.cancel({ notifications: [{ id }] });
}

export default async function scheduleReminders(
  reminders: Reminder[],
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
) {
  await LocalNotifications.requestPermissions();

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
  }

  const now = Date.now();
  for (const reminder of reminders) {
    const dt = getNextDateTime(reminder);
    if (!dt) continue;

    const scheduleAt = dt.getTime() > now ? dt : new Date(now + 1000);
    await scheduleOne(reminder, scheduleAt);
  }

  if (actionListenerRegistered) return;
  actionListenerRegistered = true;

  if (actionListenerHandle) {
    actionListenerHandle.remove();
  }

  actionListenerHandle = await LocalNotifications.addListener(
    "localNotificationActionPerformed",
    async (event) => {
      const { notification, actionId } = event;

      const reminderName = notification.body?.replace("Reminder: ", "");
      if (!reminderName) return;

      setReminders((prev) => {
        const reminder = prev.find((r) => r.name === reminderName);
        if (!reminder) return prev;

        let nextDate: string;
        let nextTime: string;

        if (actionId === "SNOOZE") {
          const snoozeAt = new Date(Date.now() + 5 * 60 * 1000);
          nextDate = snoozeAt.toISOString().split("T")[0];
          nextTime = snoozeAt.toTimeString().slice(0, 5);
          scheduleOne(reminder, snoozeAt);
        } else if (actionId === "STOP") {
          if (reminder.type === "consecutive" && reminder.consecutiveTime) {
            const nextAt = new Date(
              Date.now() + reminder.consecutiveTime * 60 * 1000,
            );
            nextDate = nextAt.toISOString().split("T")[0];
            nextTime = nextAt.toTimeString().slice(0, 5);
            scheduleOne(reminder, nextAt);
          } else {
            const nextAt = new Date();
            nextAt.setFullYear(nextAt.getFullYear() + 1);
            if (reminder.startDate) {
              const orig = new Date(reminder.startDate);
              nextAt.setMonth(orig.getMonth(), orig.getDate());
            }
            if (reminder.startTime) {
              const [h, m] = reminder.startTime.split(":").map(Number);
              nextAt.setHours(h, m, 0, 0);
            }
            nextDate = nextAt.toISOString().split("T")[0];
            nextTime = nextAt.toTimeString().slice(0, 5);
            scheduleOne(reminder, nextAt);
          }
        } else {
          const snoozeAt = new Date(Date.now() + 5 * 60 * 1000);
          nextDate = snoozeAt.toISOString().split("T")[0];
          nextTime = snoozeAt.toTimeString().slice(0, 5);
          scheduleOne(reminder, snoozeAt);
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

  await LocalNotifications.addListener(
    "localNotificationReceived",
    (notification) => {
      const reminderName = notification.body?.replace("Reminder: ", "");
      if (!reminderName) return;

      setReminders((prev) => {
        const reminder = prev.find((r) => r.name === reminderName);
        if (!reminder) return prev;

        let nextDate = reminder.startDate;
        let nextTime = reminder.startTime;

        if (reminder.type === "consecutive" && reminder.consecutiveTime) {
          const nextAt = new Date(
            Date.now() + reminder.consecutiveTime * 60 * 1000,
          );
          nextDate = nextAt.toISOString().split("T")[0];
          nextTime = nextAt.toTimeString().slice(0, 5);
          scheduleOne(reminder, nextAt);
        } else if (reminder.type === "date") {
          const nextAt = new Date();
          nextAt.setFullYear(nextAt.getFullYear() + 1);
          nextDate = nextAt.toISOString().split("T")[0];
          nextTime = nextAt.toTimeString().slice(0, 5);
          scheduleOne(reminder, nextAt);
        }

        return prev.map((r) =>
          r.name === reminderName
            ? {
                ...r,
                startDate: nextDate,
                startTime: nextTime,
                isRinging: true,
              }
            : r,
        );
      });
    },
  );
}
