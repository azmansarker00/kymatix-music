import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kymatix.music',
  appName: 'Kymatix Studio',
  webDir: 'public',
  server: {
    // আপনার লাইভ ডোমেন লিংক
    url: 'https://kymatix-music.vercel.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;