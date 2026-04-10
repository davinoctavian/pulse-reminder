import { LocalNotifications } from "@capacitor/local-notifications";
import type { Reminder } from "../interface/Reminder";

const channelMap: Record<string, string> = {
  "defaultalarm.wav": "ReminderDefault",
  "mealtime.wav": "ReminderMeal",
  "changediapers.wav": "ReminderDiapers",
  "takemedicine.wav": "ReminderMedicine",
};

export default async function scheduleReminders(
  reminders: Reminder[],
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
) {
  // Ask permission once
  await LocalNotifications.requestPermissions();

  // Schedule initial notifications
  const notifications = reminders
    .map((reminder, index) => {
      let reminderDateTime: Date | null = null;

      if (
        reminder.type === "date" &&
        reminder.startDate &&
        reminder.startTime
      ) {
        reminderDateTime = new Date(
          `${reminder.startDate}T${reminder.startTime}`,
        );
      } else if (reminder.type === "consecutive" && reminder.startTime) {
        const [hours, minutes] = reminder.startTime.split(":").map(Number);
        reminderDateTime = new Date();
        reminderDateTime.setHours(hours, minutes, 0, 0);
      }

      if (reminderDateTime && reminderDateTime.getTime() > Date.now()) {
        return {
          id: index + 1,
          title: "Reminder Alert",
          body: `Reminder: ${reminder.name}`,
          schedule: { at: reminderDateTime },
          sound: reminder.alarmFileName || "defaultalarm.wav",
          channelId: channelMap[reminder.alarmFileName || "defaultalarm.wav"],
          actionTypeId: "REMINDER_ACTIONS",
        };
      }
      return null;
    })
    .filter(Boolean) as any[];

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }

  LocalNotifications.addListener(
    "localNotificationActionPerformed",
    async (event) => {
      const { notification } = event;

      // Find the reminder that triggered
      const reminder = reminders.find(
        (r) => `Reminder: ${r.name}` === notification.body,
      );
      if (!reminder) return;

      if (event.actionId === "SNOOZE") {
        const reminderDateTime = new Date(new Date().getTime() + 5 * 60 * 1000);
        if (reminder.startDate) {
          reminder.startDate = reminderDateTime.toISOString().split("T")[0];
        }
        reminder.startTime = reminderDateTime.toTimeString().slice(0, 5);
        reminder.isRinging = false;

        // Reschedule notification
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(), // new unique ID
              title: "Reminder Alert",
              body: `Reminder: ${reminder.name}`,
              schedule: { at: reminderDateTime },
              sound: reminder.alarmFileName || "defaultalarm.wav",
              channelId:
                channelMap[reminder.alarmFileName || "defaultalarm.wav"],
              actionTypeId: "REMINDER_ACTIONS",
            },
          ],
        });
      } else if (event.actionId === "STOP") {
        if (reminder.type === "consecutive" && reminder.startTime) {
          const reminderDateTime = new Date();

          const nextDateTime = new Date(
            reminderDateTime.getTime() +
              (reminder.consecutiveTime ?? 0) * 60 * 1000,
          );
          reminder.startDate = nextDateTime.toISOString().split("T")[0];
          reminder.startTime = reminderDateTime.toTimeString().slice(0, 5);
          reminder.isRinging = false;

          // Reschedule notification
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now(), // new unique ID
                title: "Reminder Alert",
                body: `Reminder: ${reminder.name}`,
                schedule: { at: nextDateTime },
                sound: reminder.alarmFileName || "defaultalarm.wav",
                channelId:
                  channelMap[reminder.alarmFileName || "defaultalarm.wav"],
                actionTypeId: "REMINDER_ACTIONS",
              },
            ],
          });
        } else {
          const nextAlarm = new Date().setFullYear(
            new Date().getFullYear() + 1,
          );
          const reminderDateTime = new Date(nextAlarm);
          reminderDateTime.setDate(
            reminder.startDate
              ? new Date(reminder.startDate).getDate()
              : reminderDateTime.getDate(),
          );
          reminderDateTime.setHours(
            reminder.startTime
              ? parseInt(reminder.startTime.split(":")[0])
              : reminderDateTime.getHours(),
            reminder.startTime
              ? parseInt(reminder.startTime.split(":")[1])
              : reminderDateTime.getMinutes(),
            0,
            0,
          );
          reminder.startDate = reminderDateTime.toISOString().split("T")[0];
          reminder.startTime = reminderDateTime.toTimeString().slice(0, 5);
          reminder.isRinging = false;

          await LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now(), // new unique ID
                title: "Reminder Alert",
                body: `Reminder: ${reminder.name}`,
                schedule: { at: reminderDateTime },
                sound: reminder.alarmFileName || "defaultalarm.wav",
                channelId:
                  channelMap[reminder.alarmFileName || "defaultalarm.wav"],
                actionTypeId: "REMINDER_ACTIONS",
              },
            ],
          });
        }
      } else {
        reminder.isRinging = true;
      }
      setReminders((prev) =>
        prev.map((r) => (r.name === reminder.name ? { ...reminder } : r)),
      );
    },
  );
}
