package com.kymatix.music;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // ১. নোটিফিকেশন বাটন থেকে সিগন্যাল রিসিভার
    private final BroadcastReceiver mediaCommandReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null && intent.getAction() != null) {
                String jsCommand = "";
                switch (intent.getAction()) {
                    case "KYMATIX_PLAY_PAUSE": jsCommand = "window.kymatixNativeControl('play');"; break;
                    case "KYMATIX_NEXT": jsCommand = "window.kymatixNativeControl('next');"; break;
                    case "KYMATIX_PREV": jsCommand = "window.kymatixNativeControl('prev');"; break;
                }
                if (!jsCommand.isEmpty() && getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(jsCommand, null);
                }
            }
        }
    };

    // ২. হেডফোন আনপ্লাগ ডিটেকশন (খুলে ফেললে গান পজ হবে)
    private final BroadcastReceiver noisyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript("window.kymatixNativeControl('pause');", null);
                }
            }
        }
    };

    // ৩. Next.js থেকে গানের নাম রিসিভ করার ইন্টারফেস
    public class KymatixWebAppInterface {
        Context mContext;
        KymatixWebAppInterface(Context c) { mContext = c; }

        @JavascriptInterface
        public void updateTrackInfo(String title, String artist) {
            Intent intent = new Intent(mContext, MediaForegroundService.class);
            intent.setAction("UPDATE_TRACK_INFO");
            intent.putExtra("TITLE", title);
            intent.putExtra("ARTIST", artist);
            mContext.startService(intent);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent serviceIntent = new Intent(this, MediaForegroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }

        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            WebSettings settings = this.getBridge().getWebView().getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Next.js এর সাথে নেটিভ কানেকশন তৈরি করা
            this.getBridge().getWebView().addJavascriptInterface(new KymatixWebAppInterface(this), "KymatixAndroid");
        }

        // রিসিভারগুলো চালু করা
        IntentFilter filter = new IntentFilter();
        filter.addAction("KYMATIX_PLAY_PAUSE");
        filter.addAction("KYMATIX_NEXT");
        filter.addAction("KYMATIX_PREV");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(mediaCommandReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(mediaCommandReceiver, filter);
        }

        registerReceiver(noisyReceiver, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY));
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        unregisterReceiver(mediaCommandReceiver);
        unregisterReceiver(noisyReceiver);
    }

    @Override
    public void onPause() {
        super.onPause();
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            this.getBridge().getWebView().resumeTimers();
            this.getBridge().getWebView().onResume();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            this.getBridge().getWebView().resumeTimers();
            this.getBridge().getWebView().onResume();
        }
    }
}
