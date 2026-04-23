export {};

interface Reminder {
  name: string;
  type: "date" | "consecutive";
  startDate?: string;
  startTime?: string;
  consecutiveTime?: number;
  snoozeTime?: number;
  alarmFileName?: string;
  isRinging: boolean;
}

interface HistoryEntry {
  reminderName: string;
  status: "snoozed" | "stopped" | "dismissed";
  ringTime: number;
  offTime: number;
}

let reminders: Reminder[] = [];
// Track when each reminder started ringing
const ringStartTimes: Record<string, number> = {};

const STORAGE_KEY = "reminderHistory";
const MAX_ENTRIES = 100;

function saveHistory(entry: HistoryEntry) {
  try {
    const raw = self.localStorage?.getItem(STORAGE_KEY);
    const existing: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    existing.push(entry);
    if (existing.length > MAX_ENTRIES) existing.shift();
    self.localStorage?.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Worker: failed to save history", e);
  }
}

function getNextTime(reminder: Reminder): Date | null {
  if (reminder.type === "date" && reminder.startDate && reminder.startTime) {
    return new Date(`${reminder.startDate}T${reminder.startTime}`);
  }
  if (reminder.type === "consecutive" && reminder.startTime) {
    const [h, m] = reminder.startTime.split(":").map(Number);
    const dt = new Date();
    dt.setHours(h, m, 0, 0);
    return dt;
  }
  return null;
}

self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === "SET_REMINDERS") {
    reminders = payload;
  }

  if (type === "SNOOZE") {
    const { name } = payload;
    const ringTime = ringStartTimes[name] ?? Date.now();
    saveHistory({
      reminderName: name,
      status: "snoozed",
      ringTime,
      offTime: Date.now(),
    });
    delete ringStartTimes[name];
  }

  if (type === "STOP") {
    const { name } = payload;
    const ringTime = ringStartTimes[name] ?? Date.now();
    saveHistory({
      reminderName: name,
      status: "stopped",
      ringTime,
      offTime: Date.now(),
    });
    delete ringStartTimes[name];
  }
};

setInterval(() => {
  const now = new Date();
  const nowMs = now.getTime();

  reminders.forEach((reminder) => {
    if (reminder.isRinging) return; // already ringing, skip

    const dt = getNextTime(reminder);
    if (!dt) return;

    const diff = dt.getTime() - nowMs;

    // Trigger if within 30 seconds window
    if (diff <= 30000 && diff > -30000) {
      ringStartTimes[reminder.name] = Date.now();

      self.postMessage({
        type: "TRIGGER_ALARM",
        payload: {
          ...reminder,
          isRinging: true,
        },
      });
      reminder.isRinging = true; // Update local state to prevent retriggering
    }
  });
}, 10000);
