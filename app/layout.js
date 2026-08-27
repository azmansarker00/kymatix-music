import './globals.css';
import { PlayerProvider } from '@/context/PlayerContext';

export const metadata = {
  title: 'KYMATIX STUDIO',
  description: 'Monochrome Audio Experience',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#050505] text-[#FAFAFA] antialiased" suppressHydrationWarning>
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}