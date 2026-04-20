package com.davinoctavian.pulsereminderapp;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

public class ReminderReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        String reminderName = intent.getStringExtra("reminderName");
        String reminderType = intent.getStringExtra("reminderType");
        int consecutiveTime = intent.getIntExtra("consecutiveTime", 0);
        int snoozeTime = intent.getIntExtra("snoozeTime", 5);
        String alarmFile = intent.getStringExtra("alarmFile");
        String channelId = intent.getStringExtra("channelId");
        int notificationId = intent.getIntExtra("notificationId", 0);
        long startTimeMillis = intent.getLongExtra("startTimeMillis", -1);

        if ("SNOOZE".equals(action)) {
            // Cancel current notification
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            nm.cancel(notificationId);

            // Reschedule after snoozeTime minutes
            long snoozeAt = System.currentTimeMillis() + (snoozeTime * 60 * 1000L);
            scheduleNext(context, reminderName, reminderType, consecutiveTime,
                    alarmFile, channelId, notificationId, snoozeAt);
            notifyWebView(context, reminderName, snoozeAt);
            return;
        }

        if ("STOP".equals(action)) {
            // Cancel current notification
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            nm.cancel(notificationId);

            // Reschedule based on type
            long nextTime;
            if ("consecutive".equals(reminderType) && consecutiveTime > 0) {
                nextTime = System.currentTimeMillis() + (consecutiveTime * 60 * 1000L);
            } else {
                // Date type — next day same time
                nextTime = startTimeMillis > 0
                        ? startTimeMillis + (24 * 60 * 60 * 1000L)
                        : System.currentTimeMillis() + (24 * 60 * 60 * 1000L);
            }
            scheduleNext(context, reminderName, reminderType, consecutiveTime,
                    alarmFile, channelId, notificationId, nextTime);
            notifyWebView(context, reminderName, nextTime);
            return;
        }

        // Default: show notification and auto-reschedule next occurrence
        showNotification(context, notificationId, reminderName, channelId,
                reminderType, consecutiveTime, alarmFile, startTimeMillis);

        // Reschedule next occurrence immediately so it survives ignore/dismiss
        long nextTime;
        if ("consecutive".equals(reminderType) && consecutiveTime > 0) {
            nextTime = System.currentTimeMillis() + (snoozeTime * 60 * 1000L);
        } else {
            nextTime = startTimeMillis > 0
                    ? startTimeMillis + (24 * 60 * 60 * 1000L)
                    : System.currentTimeMillis() + (24 * 60 * 60 * 1000L);
        }
        scheduleNext(context, reminderName, reminderType, consecutiveTime,
                alarmFile, channelId, notificationId, nextTime);
        notifyWebView(context, reminderName, nextTime);
    }

    private void showNotification(Context context, int id, String reminderName,
                                   String channelId, String reminderType,
                                   int consecutiveTime, int snoozeTime, String alarmFile,
                                   long startTimeMillis) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        String resolvedChannelId = (channelId != null && !channelId.isEmpty())
                ? channelId
                : "ReminderDefault";

        // Open app when notification tapped
        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingOpenIntent = PendingIntent.getActivity(
                context, id, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Snooze action
        Intent snoozeIntent = new Intent(context, ReminderReceiver.class);
        snoozeIntent.setAction("SNOOZE");
        snoozeIntent.putExtra("reminderName", reminderName);
        snoozeIntent.putExtra("reminderType", reminderType);
        snoozeIntent.putExtra("consecutiveTime", consecutiveTime);
        snoozeIntent.putExtra("snoozeTime", snoozeTime);
        snoozeIntent.putExtra("alarmFile", alarmFile);
        snoozeIntent.putExtra("channelId", channelId);
        snoozeIntent.putExtra("notificationId", id);
        snoozeIntent.putExtra("startTimeMillis", startTimeMillis);
        PendingIntent snoozePending = PendingIntent.getBroadcast(
                context, id + 1, snoozeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Stop action
        Intent stopIntent = new Intent(context, ReminderReceiver.class);
        stopIntent.setAction("STOP");
        stopIntent.putExtra("reminderName", reminderName);
        stopIntent.putExtra("reminderType", reminderType);
        stopIntent.putExtra("consecutiveTime", consecutiveTime);
        stopIntent.putExtra("snoozeTime", snoozeTime);
        stopIntent.putExtra("alarmFile", alarmFile);
        stopIntent.putExtra("channelId", channelId);
        stopIntent.putExtra("notificationId", id);
        stopIntent.putExtra("startTimeMillis", startTimeMillis);
        PendingIntent stopPending = PendingIntent.getBroadcast(
                context, id + 2, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new Notification.Builder(context, resolvedChannelId)
                .setContentTitle("Reminder Alert")
                .setContentText("Reminder: " + reminderName)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentIntent(pendingOpenIntent)
                .setAutoCancel(true)
                .addAction(0, "Snooze", snoozePending)
                .addAction(0, "Stop", stopPending)
                .build();

        nm.notify(id, notification);
    }

    private void scheduleNext(Context context, String reminderName, String reminderType,
                               int consecutiveTime, int snoozeTime, String alarmFile, String channelId,
                               int notificationId, long triggerAtMillis) {
        Intent nextIntent = new Intent(context, ReminderReceiver.class);
        nextIntent.putExtra("reminderName", reminderName);
        nextIntent.putExtra("reminderType", reminderType);
        nextIntent.putExtra("consecutiveTime", consecutiveTime);
        nextIntent.putExtra("snoozeTime", snoozeTime);
        nextIntent.putExtra("alarmFile", alarmFile);
        nextIntent.putExtra("channelId", channelId);
        nextIntent.putExtra("notificationId", notificationId);
        nextIntent.putExtra("startTimeMillis", triggerAtMillis);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId,
                nextIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        }
    }

    private void notifyWebView(Context context, String reminderName, long nextMillis) {
        String nextDate = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
            .format(new java.util.Date(nextMillis));
        String nextTime = new java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault())
            .format(new java.util.Date(nextMillis));

        Intent broadcast = new Intent("REMINDER_UPDATED");
        broadcast.putExtra("reminderName", reminderName);
        broadcast.putExtra("nextDate", nextDate);
        broadcast.putExtra("nextTime", nextTime);

        androidx.localbroadcastmanager.content.LocalBroadcastManager
            .getInstance(context)
            .sendBroadcast(broadcast);
    }
}