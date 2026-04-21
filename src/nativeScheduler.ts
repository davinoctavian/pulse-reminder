import { registerPlugin } from "@capacitor/core";

interface NativeSchedulerPlugin {
  schedule(options: {
    reminderName: string;
    reminderType: string;
    consecutiveTime: number;
    snoozeTime: number;
    alarmFile: string;
    channelId: string;
    notificationId: number;
    triggerAtMillis: number;
  }): Promise<void>;
  cancel(options: { notificationId: number }): Promise<void>;
  getScheduledTimes(): Promise<Record<string, string>>;
  addListener(
    eventName: "reminderUpdated",
    listenerFunc: (data: {
      reminderName: string;
      nextDate: string;
      nextTime: string;
    }) => void,
  ): Promise<{ remove: () => void }>;
}

const NativeScheduler =
  registerPlugin<NativeSchedulerPlugin>("NativeScheduler");
export default NativeScheduler;
