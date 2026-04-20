package com.davinoctavian.pulsereminderapp;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class NativeScheduler {

    public static void schedule(Context context, String reminderName, String reminderType,
                                 int consecutiveTime, int snoozeTime, String alarmFile, String channelId,
                                 int notificationId, long triggerAtMillis) {

        Intent intent = new Intent(context, ReminderReceiver.class);
        intent.putExtra("reminderName", reminderName);
        intent.putExtra("reminderType", reminderType);
        intent.putExtra("consecutiveTime", consecutiveTime);
        intent.putExtra("snoozeTime", snoozeTime);
        intent.putExtra("alarmFile", alarmFile);
        intent.putExtra("channelId", channelId);
        intent.putExtra("notificationId", notificationId);
        intent.putExtra("startTimeMillis", triggerAtMillis);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        }
    }

    public static void cancel(Context context, int notificationId) {
        Intent intent = new Intent(context, ReminderReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        alarmManager.cancel(pendingIntent);
    }
}