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
            String channelId = "ReminderChannel";
            String channelName = "Reminders";
            NotificationManager notificationManager = getSystemService(NotificationManager.class);

            Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.defaultalarm);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();

            NotificationChannel channel = new NotificationChannel(
                    channelId,
                    channelName,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Reminder notifications with sound");
            channel.setSound(soundUri, audioAttributes);
            channel.enableVibration(true);

            notificationManager.createNotificationChannel(channel);
        }
    }
}