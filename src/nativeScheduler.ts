import { registerPlugin } from "@capacitor/core";

interface NativeSchedulerPlugin {
  schedule(options: {
    reminderName: string;
    reminderType: string;
    consecutiveTime: number;
    alarmFile: string;
    channelId: string;
    notificationId: number;
    triggerAtMillis: number;
  }): Promise<void>;
  cancel(options: { notificationId: number }): Promise<void>;
}

const NativeScheduler =
  registerPlugin<NativeSchedulerPlugin>("NativeScheduler");
export default NativeScheduler;
