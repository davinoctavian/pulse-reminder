export interface Reminder {
  name: string;
  type: string;
  base?: string;
  startDate?: string;
  startTime?: string;
  consecutiveTime?: number;
  stopButton?: boolean;
  stopTimerButton?: boolean;
  alarmFile?: string | null;
  alarmFileName?: string | null;
  isRinging: boolean;
}
