package com.davinoctavian.pulsereminderapp;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeScheduler")
public class NativeSchedulerPlugin extends Plugin {

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