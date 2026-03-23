export {};

let reminders: any[] = [];

self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === "SET_REMINDERS") {
    reminders = payload;
  }
};

setInterval(() => {
  const now = new Date();
  reminders.forEach((reminder) => {
    if (reminder.type === "date") {
      if (reminder.startDate && reminder.startTime) {
        const reminderDateTime = new Date(
          `${reminder.startDate}T${reminder.startTime}`,
        );
        if (reminderDateTime.getTime() - now.getTime() < 30000) {
          self.postMessage({ type: "TRIGGER_ALARM", reminder });
        }
      }
    } else {
      if (reminder.startTime) {
        const [hours, minutes] = reminder.startTime.split(":").map(Number);
        const reminderDateTime = new Date();
        reminderDateTime.setHours(hours, minutes, 0, 0);
        if (Math.abs(reminderDateTime.getTime() - now.getTime()) < 30000) {
          self.postMessage({ type: "TRIGGER_ALARM", reminder });

          const nextDateTime = new Date(
            reminderDateTime.getTime() + 20 * 60 * 1000,
          );

          const nextHours = String(nextDateTime.getHours()).padStart(2, "0");
          const nextMinutes = String(nextDateTime.getMinutes()).padStart(
            2,
            "0",
          );
          reminder.startTime = `${nextHours}:${nextMinutes}`;
        }
      }
    }
  });
}, 30000);
