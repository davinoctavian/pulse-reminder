export interface Reminder {
  type: string;
  base?: string;
  startDate?: string;
  startTime?: string;
  consecutiveTime?: number;
  stopButton?: boolean;
  stopTimerButton?: boolean;
}
