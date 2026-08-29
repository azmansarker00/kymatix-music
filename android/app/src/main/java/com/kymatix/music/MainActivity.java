package com.kymatix.music;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // [নতুন] অ্যাপ চালু হওয়ার সাথে সাথে মিউজিক ফোরগ্রাউন্ড সার্ভিসটি স্টার্ট করে দেওয়া হচ্ছে
        Intent serviceIntent = new Intent(this, MediaForegroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }

        // ১. WebView-কে অডিও অটো-প্লে করার পূর্ণ পারমিশন দেওয়া
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            WebSettings settings = this.getBridge().getWebView().getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // ২. ক্যাপাসিটরের ডিফল্ট Pause সিস্টেমকে বাইপাস করা হচ্ছে (ম্যাজিক হ্যাক)
        // অ্যাপ মিনিমাইজ হলেও অডিও ইঞ্জিন জোর করে চালু থাকবে!
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            this.getBridge().getWebView().resumeTimers();
            this.getBridge().getWebView().onResume();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        // ৩. স্ক্রিন লক হলেও WebView এবং অডিও ইঞ্জিন সচল থাকবে
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            this.getBridge().getWebView().resumeTimers();
            this.getBridge().getWebView().onResume();
        }
    }
}
