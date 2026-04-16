package com.davinoctavian.pulsereminderapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.app.NotificationManager;
import android.app.Notification;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

public class ReminderReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String reminderName = intent.getStringExtra("reminderName");
        String reminderType = intent.getStringExtra("reminderType");
        int consecutiveTime = intent.getIntExtra("consecutiveTime", 0);
        String alarmFile = intent.getStringExtra("alarmFile");
        String channelId = intent.getStringExtra("channelId");
        int notificationId = intent.getIntExtra("notificationId", 0);

        // Show the notification
        showNotification(context, notificationId, reminderName, channelId);

        // Immediately reschedule next occurrence
        rescheduleNext(context, intent, reminderName, reminderType, consecutiveTime, alarmFile, channelId, notificationId);
    }

    private void showNotification(Context context, int id, String reminderName, String channelId) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        Notification notification = new Notification.Builder(context, channelId != null ? channelId : "ReminderDefault")
                .setContentTitle("Reminder Alert")
                .setContentText("Reminder: " + reminderName)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setAutoCancel(true)
                .build();

        nm.notify(id, notification);
    }

    private void rescheduleNext(Context context, Intent intent, String reminderName,
                                String reminderType, int consecutiveTime,
                                String alarmFile, String channelId, int notificationId) {
        long nextTime;

        if ("consecutive".equals(reminderType) && consecutiveTime > 0) {
            nextTime = System.currentTimeMillis() + (consecutiveTime * 60 * 1000L);
        } else {
            // Date type — reschedule next day same time
            long startTimeMillis = intent.getLongExtra("startTimeMillis", -1);
            if (startTimeMillis == -1) return;

            nextTime = startTimeMillis + (24 * 60 * 60 * 1000L);
        }

        // Schedule next alarm
        Intent nextIntent = new Intent(context, ReminderReceiver.class);
        nextIntent.putExtra("reminderName", reminderName);
        nextIntent.putExtra("reminderType", reminderType);
        nextIntent.putExtra("consecutiveTime", consecutiveTime);
        nextIntent.putExtra("alarmFile", alarmFile);
        nextIntent.putExtra("channelId", channelId);
        nextIntent.putExtra("notificationId", notificationId);
        nextIntent.putExtra("startTimeMillis", nextTime);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId,
                nextIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTime, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, nextTime, pendingIntent);
        }
    }
}