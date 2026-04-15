package com.davinoctavian.pulsereminderapp;

import android.app.Notification;
import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

public class ReminderForegroundService extends Service {
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification notification = new Notification.Builder(this, "ReminderDefault")
                .setContentTitle("Reminder Active")
                .setContentText("Reminders are running in background")
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .build();
        startForeground(1, notification);
        return START_STICKY; // Restart if killed
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}