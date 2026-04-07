package com.davinoctavian.pulsereminderapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            createChannel(notificationManager, "ReminderDefault", "Default Alarm", R.raw.defaultalarm);
            createChannel(notificationManager, "ReminderMeal", "Meal Time Alarm", R.raw.mealtime);
            createChannel(notificationManager, "ReminderDiapers", "Diapers Change Alarm", R.raw.changediapers);
            createChannel(notificationManager, "ReminderMedicine", "Medicine Time Alarm", R.raw.takemedicine);  
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

        manager.createNotificationChannel(channel);
    }

}