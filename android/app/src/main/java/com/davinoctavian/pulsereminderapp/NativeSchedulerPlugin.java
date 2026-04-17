package com.davinoctavian.pulsereminderapp;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name = "NativeScheduler")
public class NativeSchedulerPlugin extends Plugin {

    private static NativeSchedulerPlugin instance;

    @Override
    public void load() {
        instance = this;
        // Register broadcast receiver to forward events to WebView
        androidx.localbroadcastmanager.content.LocalBroadcastManager.getInstance(getContext())
            .registerReceiver(reminderUpdateReceiver,
                new android.content.IntentFilter("REMINDER_UPDATED"));
    }

    private final android.content.BroadcastReceiver reminderUpdateReceiver =
        new android.content.BroadcastReceiver() {
            @Override
            public void onReceive(android.content.Context context, android.content.Intent intent) {
                String reminderName = intent.getStringExtra("reminderName");
                String nextDate = intent.getStringExtra("nextDate");
                String nextTime = intent.getStringExtra("nextTime");

                com.getcapacitor.JSObject data = new com.getcapacitor.JSObject();
                data.put("reminderName", reminderName);
                data.put("nextDate", nextDate);
                data.put("nextTime", nextTime);
                notifyListeners("reminderUpdated", data);
            }
        };

    @PluginMethod
    public void schedule(PluginCall call) {
        String reminderName = call.getString("reminderName", "");
        String reminderType = call.getString("reminderType", "date");
        int consecutiveTime = call.getInt("consecutiveTime", 0);
        String alarmFile = call.getString("alarmFile", "defaultalarm.wav");
        String channelId = call.getString("channelId", "ReminderDefault");
        int notificationId = call.getInt("notificationId", 0);
        long triggerAtMillis = call.getLong("triggerAtMillis", 0L);

        NativeScheduler.schedule(
            getContext(), reminderName, reminderType,
            consecutiveTime, alarmFile, channelId,
            notificationId, triggerAtMillis
        );
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        int notificationId = call.getInt("notificationId", 0);
        NativeScheduler.cancel(getContext(), notificationId);
        call.resolve();
    }
}