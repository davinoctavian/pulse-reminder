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

export async function cancelReminder(reminderName: string) {
  const id = getNotificationId(reminderName);
  await LocalNotifications.cancel({ notifications: [{ id }] });
}

let listenersInitialized = false;

export async function initNotificationListeners(
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
) {
  if (listenersInitialized) return;
  listenersInitialized = true;

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
          scheduleOne(
            { ...reminder, startDate: nextDate, startTime: nextTime },
            nextAt,
          );
        } else if (reminder.type === "date") {
          const nextAt = new Date();
          nextAt.setDate(nextAt.getDate() + 1);
          if (reminder.startTime) {
            const [h, m] = reminder.startTime.split(":").map(Number);
            nextAt.setHours(h, m, 0, 0);
          }
          nextDate = nextAt.toISOString().split("T")[0];
          nextTime = nextAt.toTimeString().slice(0, 5);
          scheduleOne(
            { ...reminder, startDate: nextDate, startTime: nextTime },
            nextAt,
          );
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

  await LocalNotifications.addListener(
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
          const nextAt = new Date(Date.now() + 5 * 60 * 1000);
          nextDate = nextAt.toISOString().split("T")[0];
          nextTime = nextAt.toTimeString().slice(0, 5);
          scheduleOne(reminder, nextAt);
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
            if (reminder.startTime) {
              const [h, m] = reminder.startTime.split(":").map(Number);
              nextAt.setHours(h, m, 0, 0);
            }
            nextDate = nextAt.toISOString().split("T")[0];
            nextTime = nextAt.toTimeString().slice(0, 5);
            scheduleOne(reminder, nextAt);
          }
        } else {
          // Tapped notification body — treat as snooze
          const nextAt = new Date(Date.now() + 5 * 60 * 1000);
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
                isRinging: false,
              }
            : r,
        );
      });
    },
  );
}

// scheduleReminders now only handles scheduling, no listeners
export default async function scheduleReminders(reminders: Reminder[]) {
  await LocalNotifications.requestPermissions();

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
  }

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

    await scheduleOne(reminder, scheduleAt);
  }
}
