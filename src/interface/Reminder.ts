export interface Reminder {
  name: string;
  type: string;
  base?: string;
  startDate?: string;
  startTime?: string;
  consecutiveTime?: number;
  alarmFile?: string | null;
  alarmFileName?: string | null;
  isRinging: boolean;
}
