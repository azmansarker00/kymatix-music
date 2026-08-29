package com.kymatix.music; // আপনার প্যাকেজ নাম যদি ভিন্ন হয়, সেটি দিন

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

public class MediaForegroundService extends Service {

    private static final String CHANNEL_ID = "KymatixMediaChannel";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // একটি সাধারণ সাইলেন্ট নোটিফিকেশন তৈরি করা হচ্ছে সার্ভিসটি বাঁচিয়ে রাখার জন্য
        Notification notification = null;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            notification = new Notification.Builder(this, CHANNEL_ID)
                    .setContentTitle("KYMATIX Studio")
                    .setContentText("Playing music in background...")
                    .setSmallIcon(android.R.drawable.ic_media_play) // ডিফল্ট প্লে আইকন
                    .setOngoing(true)
                    .build();
        }

        // ফোরগ্রাউন্ড সার্ভিস স্টার্ট করা
        startForeground(1, notification);

        // START_STICKY এর মানে হলো সিস্টেম মেমোরি বাঁচানোর জন্য অ্যাপ কিল করলেও যেন আবার একা একা চালু হয়
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // আমাদের কোনো বাইন্ডিং দরকার নেই
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Kymatix Media Playback",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Keeps music playing in the background");

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}
