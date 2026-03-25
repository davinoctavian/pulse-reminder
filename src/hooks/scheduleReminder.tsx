import { LocalNotifications } from "@capacitor/local-notifications";
import type { Reminder } from "../interface/Reminder";

export default async function scheduleReminders(reminders: Reminder[]) {
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
        // One-time reminder with date + time
        reminderDateTime = new Date(
          `${reminder.startDate}T${reminder.startTime}`,
        );
      } else if (reminder.type === "consecutive" && reminder.startTime) {
        const [hours, minutes] = reminder.startTime.split(":").map(Number);
        reminderDateTime = new Date();
        reminderDateTime.setHours(hours, minutes, 0, 0);
      }

      if (!reminderDateTime) return null;

      return {
        id: index + 1,
        title: "Reminder Alert",
        body: `Reminder: ${reminder.name}`,
        schedule: { at: reminderDateTime },
        sound: reminder.nativeSound || "defaultalarm.mp3",
      };
    })
    .filter(Boolean) as any[];

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }

  // Handle consecutive rescheduling (+20 minutes)
  LocalNotifications.addListener(
    "localNotificationActionPerformed",
    async (event) => {
      const { notification } = event;

      // Find the reminder that triggered
      const reminder = reminders.find(
        (r) => `Reminder: ${r.name}` === notification.body,
      );
      if (!reminder) return;

      if (reminder.type === "consecutive" && reminder.startTime) {
        // Parse current time
        const [hours, minutes] = reminder.startTime.split(":").map(Number);
        const reminderDateTime = new Date();
        reminderDateTime.setHours(hours, minutes, 0, 0);

        // Add 20 minutes
        const nextDateTime = new Date(
          reminderDateTime.getTime() + 20 * 60 * 1000,
        );

        // Update reminder.startTime string
        const nextHours = String(nextDateTime.getHours()).padStart(2, "0");
        const nextMinutes = String(nextDateTime.getMinutes()).padStart(2, "0");
        reminder.startTime = `${nextHours}:${nextMinutes}`;

        // Reschedule notification
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(), // new unique ID
              title: "Reminder Alert",
              body: `Reminder: ${reminder.name}`,
              schedule: { at: nextDateTime },
              sound: reminder.nativeSound || "defaultalarm.mp3",
            },
          ],
        });
      }
    },
  );
}
