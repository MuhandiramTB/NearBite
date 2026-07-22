import type { ReactNode } from 'react';
import './globals.css';
import { ThemeProvider } from '@/lib/ui/theme';
import { AuthGateProvider } from '@/lib/auth/auth-gate';
import { Nav } from './nav';
import { BottomNav } from './bottom-nav';

export const metadata = {
  title: 'NearBite — always-fresh local food',
  description: 'Trusted, always-fresh local food discovery in Sri Lanka.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthGateProvider>
            <Nav />
            <main className="container" style={{ padding: '28px 20px 92px' }}>
              {children}
            </main>
            <BottomNav />
          </AuthGateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
