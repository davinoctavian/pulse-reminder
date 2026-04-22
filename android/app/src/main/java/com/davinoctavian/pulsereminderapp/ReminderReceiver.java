package com.davinoctavian.pulsereminderapp;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;

public class ReminderReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        String reminderName   = intent.getStringExtra("reminderName");
        String reminderType   = intent.getStringExtra("reminderType");
        int consecutiveTime   = intent.getIntExtra("consecutiveTime", 0);
        int snoozeTime        = intent.getIntExtra("snoozeTime", 5);
        String alarmFile      = intent.getStringExtra("alarmFile");
        String channelId      = intent.getStringExtra("channelId");
        int notificationId    = intent.getIntExtra("notificationId", 0);
        long startTimeMillis  = intent.getLongExtra("startTimeMillis", -1);

        if ("SNOOZE".equals(action)) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(notificationId);
            stopVibration(context);

            long snoozeAt = System.currentTimeMillis() + (snoozeTime * 60 * 1000L);
            scheduleNext(context, reminderName, reminderType, consecutiveTime, snoozeTime,
                    alarmFile, channelId, notificationId, snoozeAt);
            saveScheduledTime(context, reminderName, snoozeAt);
            return;
        }

        if ("STOP".equals(action)) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(notificationId);
            stopVibration(context);

            long nextTime;
            if ("consecutive".equals(reminderType) && consecutiveTime > 0) {
                nextTime = System.currentTimeMillis() + (consecutiveTime * 60 * 1000L);
            } else {
                nextTime = startTimeMillis > 0
                        ? startTimeMillis + (24 * 60 * 60 * 1000L)
                        : System.currentTimeMillis() + (24 * 60 * 60 * 1000L);
            }
            scheduleNext(context, reminderName, reminderType, consecutiveTime, snoozeTime,
                    alarmFile, channelId, notificationId, nextTime);
            saveScheduledTime(context, reminderName, nextTime);
            return;
        }

        if ("DISMISS".equals(action)) {
            // Fired when user swipes notification away
            stopVibration(context);
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(notificationId);
            return;
        }

        // Default: alarm fired — show notification, vibrate, reschedule next
        showNotification(context, notificationId, reminderName, channelId,
                reminderType, consecutiveTime, snoozeTime, alarmFile, startTimeMillis);
        startVibration(context);


        long nextTime;
        if ("consecutive".equals(reminderType) && consecutiveTime > 0) {
            nextTime = System.currentTimeMillis() + (snoozeTime * 60 * 1000L);
        } else {
            nextTime = startTimeMillis > 0
                    ? startTimeMillis + (24 * 60 * 60 * 1000L)
                    : System.currentTimeMillis() + (24 * 60 * 60 * 1000L);
        }

        scheduleNext(context, reminderName, reminderType, consecutiveTime, snoozeTime,
                alarmFile, channelId, notificationId, nextTime);
        saveScheduledTime(context, reminderName, nextTime);
    }

    private void startVibration(Context context) {
        long[] pattern = {0, 800, 400, 800, 400, 800, 400};

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm = (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            if (vm != null) {
                vm.getDefaultVibrator().vibrate(VibrationEffect.createWaveform(pattern, 1));
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 1));
            }
        } else {
            Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                vibrator.vibrate(pattern, 1);
            }
        }
    }

    private void stopVibration(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm = (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            if (vm != null) vm.getDefaultVibrator().cancel();
        } else {
            Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null) vibrator.cancel();
        }
    }

    private void showNotification(Context context, int id, String reminderName,
                                   String channelId, String reminderType,
                                   int consecutiveTime, int snoozeTime,
                                   String alarmFile, long startTimeMillis) {

        String resolvedChannelId = (channelId != null && !channelId.isEmpty())
                ? channelId : "ReminderDefault";

        // Full screen intent — opens AlarmActivity over lock screen
        Intent fullScreenIntent = new Intent(context, AlarmActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        fullScreenIntent.putExtra("reminderName", reminderName);
        fullScreenIntent.putExtra("reminderType", reminderType);
        fullScreenIntent.putExtra("consecutiveTime", consecutiveTime);
        fullScreenIntent.putExtra("snoozeTime", snoozeTime);
        fullScreenIntent.putExtra("alarmFile", alarmFile);
        fullScreenIntent.putExtra("channelId", channelId);
        fullScreenIntent.putExtra("notificationId", id);
        fullScreenIntent.putExtra("startTimeMillis", startTimeMillis);
        PendingIntent fullScreenPending = PendingIntent.getActivity(
                context, id, fullScreenIntent,
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

        // Dismiss intent — fires when notification is swiped away
        Intent dismissIntent = new Intent(context, ReminderReceiver.class);
        dismissIntent.setAction("DISMISS");
        dismissIntent.putExtra("notificationId", id);
        PendingIntent dismissPending = PendingIntent.getBroadcast(
                context, id + 3, dismissIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationManager nm = (NotificationManager)
                context.getSystemService(Context.NOTIFICATION_SERVICE);

        Notification notification = new Notification.Builder(context, resolvedChannelId)
                .setContentTitle("⏰  " + reminderName)
                .setContentText("Tap to open, or use Snooze / Stop")
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setFullScreenIntent(fullScreenPending, true)
                .setCategory(Notification.CATEGORY_ALARM)
                .setPriority(Notification.PRIORITY_MAX)
                .setAutoCancel(true)    // ← allows swipe dismiss
                .setOngoing(false)      // ← not ongoing, user can swipe away
                .addAction(R.drawable.ic_snooze, "Snooze " + snoozeTime + " min", snoozePending)
                .addAction(R.drawable.ic_stop, "Stop", stopPending)
                .setDeleteIntent(dismissPending)  // ← fires on swipe
                .build();

        if (nm != null) nm.notify(id, notification);
    }

    private void scheduleNext(Context context, String reminderName, String reminderType,
                               int consecutiveTime, int snoozeTime, String alarmFile,
                               String channelId, int notificationId, long triggerAtMillis) {
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

    private void saveScheduledTime(Context context, String reminderName, long nextMillis) {
        String nextDate = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
                .format(new java.util.Date(nextMillis));
        String nextTime = new java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault())
                .format(new java.util.Date(nextMillis));

        // Save to SharedPreferences so app can read on next open
        context.getSharedPreferences("ReminderSchedule", Context.MODE_PRIVATE)
                .edit()
                .putString(reminderName + "_date", nextDate)
                .putString(reminderName + "_time", nextTime)
                .apply();

        // Broadcast to WebView if app is in foreground
        notifyWebView(context, reminderName, nextMillis);
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
        context.sendBroadcast(broadcast);
    }
}