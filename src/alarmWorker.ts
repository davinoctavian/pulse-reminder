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
          if (reminder.isRinging === false) {
            reminder.startDate = new Date().toISOString().split("T")[0];
            reminder.isRinging = true;
            self.postMessage({ type: "TRIGGER_ALARM", payload: reminder });
          }
        }
      }
    } else {
      if (reminder.startTime) {
        const [hours, minutes] = reminder.startTime.split(":").map(Number);
        const reminderDateTime = new Date();
        reminderDateTime.setHours(hours, minutes, 0, 0);
        if (reminderDateTime.getTime() - now.getTime() < 30000) {
          if (reminder.isRinging === false) {
            reminder.isRinging = true;
            self.postMessage({ type: "TRIGGER_ALARM", payload: reminder });
          }
        }
      }
    }
  });
}, 10000);
