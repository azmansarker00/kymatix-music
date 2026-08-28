import './globals.css';
import { PlayerProvider } from '@/context/PlayerContext';

export const metadata = {
  title: 'KYMATIX STUDIO',
  description: 'Audio Streaming Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      </head>
      <body className="bg-[#08090C] text-[#E3E2E6] antialiased selection:bg-[#E11D48] selection:text-white" suppressHydrationWarning>
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}