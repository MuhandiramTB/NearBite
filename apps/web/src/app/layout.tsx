import type { ReactNode } from 'react';
import './globals.css';
import { ThemeProvider } from '@/lib/ui/theme';
import { AuthGateProvider } from '@/lib/auth/auth-gate';
import { Nav } from './nav';

export const metadata = {
  title: 'NearBite — always-fresh local food',
  description: 'Trusted, always-fresh local food discovery in Sri Lanka.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthGateProvider>
            <Nav />
            <main className="container" style={{ padding: '28px 20px 72px' }}>
              {children}
            </main>
          </AuthGateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
