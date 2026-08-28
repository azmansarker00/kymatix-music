package com.kymatix.music;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            WebView webView = this.getBridge().getWebView();
            WebSettings settings = webView.getSettings();

            // ব্যাকগ্রাউন্ডে অডিও ও স্ক্রিপ্ট থ্রেড সচল রাখার কনফিগারেশন
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
        } catch (Exception ignored) {}
    }

    @Override
    public void onPause() {
        super.onPause();
        try {
            // মিনিমাইজ বা লক হলেও টাইমার সচল রাখা
            this.getBridge().getWebView().resumeTimers();
        } catch (Exception ignored) {}
    }

    @Override
    public void onStop() {
        super.onStop();
        try {
            this.getBridge().getWebView().resumeTimers();
        } catch (Exception ignored) {}
    }
}