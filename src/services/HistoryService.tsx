import { Capacitor } from "@capacitor/core";
import NativeScheduler from "../nativeScheduler";

export interface HistoryEntry {
  reminderName: string;
  status: "snoozed" | "stopped" | "dismissed" | "created" | "updated";
  ringTime: number;
  offTime: number;
}

const platform = Capacitor.getPlatform();
const STORAGE_KEY = "reminderHistory";
const MAX_ENTRIES = 100;

export async function getHistory(): Promise<HistoryEntry[]> {
  if (platform !== "web") {
    try {
      const result = await NativeScheduler.getHistory();
      return JSON.parse(result.entries) as HistoryEntry[];
    } catch {
      return [];
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  if (platform !== "web") {
    try {
      await NativeScheduler.saveHistory({
        reminderName: entry.reminderName,
        status: entry.status,
        ringTime: entry.ringTime,
        offTime: entry.offTime,
      });
    } catch (e) {
      console.error("Failed to save history on Android", e);
    }
    return;
  }
  // Web — localStorage
  try {
    const existing = await getHistory();
    existing.push(entry);
    if (existing.length > MAX_ENTRIES) existing.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to save history", e);
  }
}

export async function clearHistory(): Promise<void> {
  if (platform !== "web") {
    try {
      await NativeScheduler.clearHistory();
    } catch (e) {
      console.error("Failed to clear history", e);
    }
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

export function getHistoryForReminder(
  all: HistoryEntry[],
  reminderName: string,
): HistoryEntry[] {
  return all.filter((e) => e.reminderName === reminderName).reverse();
}
