package com.davinoctavian.pulsereminderapp;

import android.app.Activity;
import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.WindowManager;
import androidx.cardview.widget.CardView;
import android.widget.TextView;

public class AlarmActivity extends Activity {

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private String reminderName;
    private String reminderType;
    private int consecutiveTime;
    private int snoozeTime;
    private String alarmFile;
    private String channelId;
    private int notificationId;
    private long startTimeMillis;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = getSystemService(KeyguardManager.class);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }

        setContentView(R.layout.activity_alarm);

        // Read intent extras
        Intent intent = getIntent();
        reminderName    = intent.getStringExtra("reminderName");
        reminderType    = intent.getStringExtra("reminderType");
        consecutiveTime = intent.getIntExtra("consecutiveTime", 0);
        snoozeTime      = intent.getIntExtra("snoozeTime", 5);
        alarmFile       = intent.getStringExtra("alarmFile");
        channelId       = intent.getStringExtra("channelId");
        notificationId  = intent.getIntExtra("notificationId", 0);
        startTimeMillis = intent.getLongExtra("startTimeMillis", -1);

        // Set reminder name in UI
        TextView nameView = findViewById(R.id.alarm_name);
        if (nameView != null) nameView.setText(reminderName);

        // Play alarm sound
        playAlarm();

        // Vibrate
        startVibration();

        // Snooze button
        CardView snoozeBtn = findViewById(R.id.btn_snooze);
        if (snoozeBtn != null) {
            snoozeBtn.setOnClickListener(v -> handleSnooze());
        }

        // Stop button
        CardView stopBtn = findViewById(R.id.btn_stop);
        if (stopBtn != null) {
            stopBtn.setOnClickListener(v -> handleStop());
        }
    }

    @Override
    public void onBackPressed() {
        // Back button = snooze and close
        handleSnooze();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Called when MainActivity sends CLOSE signal
        if (intent.getBooleanExtra("CLOSE", false)) {
            stopAll();
            finish();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Stop sound/vibration when user leaves but keep activity in stack
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.pause();
        }
        stopVibration();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Resume when user comes back to AlarmActivity
        if (mediaPlayer != null && !mediaPlayer.isPlaying()) {
            mediaPlayer.start();
        }
        startVibration();
    }

    @Override
    protected void onDestroy() {
        stopAll();
        super.onDestroy();
    }

    private void playAlarm() {
        try {
            Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/raw/" +
                (alarmFile != null ? alarmFile.replace(".wav", "") : "defaultalarm"));
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
            mediaPlayer.setDataSource(getApplicationContext(), soundUri);
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception e) {
            android.util.Log.e("AlarmActivity", "Failed to play alarm: " + e.getMessage());
        }
    }

    private void startVibration() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            if (vm != null) {
                vibrator = vm.getDefaultVibrator();
            }
        } else {
            vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        }

        if (vibrator == null || !vibrator.hasVibrator()) return;

        long[] pattern = {0, 800, 400, 800, 400, 800, 400};
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 1));
        } else {
            vibrator.vibrate(pattern, 1);
        }
    }

    private void stopVibration() {
        if (vibrator != null) {
            vibrator.cancel();
            vibrator = null;
        }
    }

    private void stopAll() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception e) {
                android.util.Log.e("AlarmActivity", "MediaPlayer stop error: " + e.getMessage());
            }
            mediaPlayer = null;
        }
        stopVibration();
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(notificationId);
    }

    private void broadcastUpdate(long nextMillis) {
        String nextDate = new java.text.SimpleDateFormat("yyyy-MM-dd",
            java.util.Locale.getDefault()).format(new java.util.Date(nextMillis));
        String nextTime = new java.text.SimpleDateFormat("HH:mm",
            java.util.Locale.getDefault()).format(new java.util.Date(nextMillis));

        Intent broadcast = new Intent("REMINDER_UPDATED");
        broadcast.putExtra("reminderName", reminderName);
        broadcast.putExtra("nextDate", nextDate);
        broadcast.putExtra("nextTime", nextTime);
        sendBroadcast(broadcast);
    }

    private void handleSnooze() {
        stopAll();
        long snoozeAt = System.currentTimeMillis() + (snoozeTime * 60 * 1000L);
        NativeScheduler.schedule(this, reminderName, reminderType, consecutiveTime,
            snoozeTime, alarmFile, channelId, notificationId, snoozeAt);
        broadcastUpdate(snoozeAt);
        // Go back to MainActivity instead of just finishing
        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(mainIntent);
        finish();
    }

    private void handleStop() {
        stopAll();
        long nextAt;
        if ("consecutive".equals(reminderType) && consecutiveTime > 0) {
            nextAt = System.currentTimeMillis() + (consecutiveTime * 60 * 1000L);
        } else {
            nextAt = startTimeMillis > 0
                ? startTimeMillis + (24 * 60 * 60 * 1000L)
                : System.currentTimeMillis() + (24 * 60 * 60 * 1000L);
        }
        NativeScheduler.schedule(this, reminderName, reminderType, consecutiveTime,
            snoozeTime, alarmFile, channelId, notificationId, nextAt);
        broadcastUpdate(nextAt);
        // Go back to MainActivity instead of just finishing
        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(mainIntent);
        finish();
    }
}