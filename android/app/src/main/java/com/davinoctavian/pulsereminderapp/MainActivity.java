package com.davinoctavian.pulsereminderapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.app.AlarmManager;
import android.content.Intent;
import android.provider.Settings;
import android.os.PowerManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            if (!pm.isIgnoringBatteryOptimizations(getPackageName())) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);
            if (!alarmManager.canScheduleExactAlarms()) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                startActivity(intent);
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            createChannel(notificationManager, "ReminderDefault", "Default Alarm", R.raw.defaultalarm);
            createChannel(notificationManager, "ReminderMeal", "Meal Time Alarm", R.raw.mealtime);
            createChannel(notificationManager, "ReminderDiapers", "Diapers Change Alarm", R.raw.changediapers);
            createChannel(notificationManager, "ReminderMedicine", "Medicine Time Alarm", R.raw.takemedicine);

            startForegroundService(new Intent(this, ReminderForegroundService.class));
        } else {
            startService(new Intent(this, ReminderForegroundService.class));
        }
    }
    private void createChannel(NotificationManager manager, String id, String name, int rawSound) {
        Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + rawSound);

        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

        NotificationChannel channel = new NotificationChannel(
                id,
                name,
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Reminder notifications with sound");
        channel.setSound(soundUri, audioAttributes);
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 500, 500, 500});

        if (manager.getNotificationChannel(id) != null) {
            manager.deleteNotificationChannel(id);
        }
        manager.createNotificationChannel(channel);
    }

}