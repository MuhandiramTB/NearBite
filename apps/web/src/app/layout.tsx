import type { ReactNode } from 'react';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
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
        <I18nProvider>
          <AuthGateProvider>
            <Nav />
            <main className="container" style={{ padding: '28px 20px 72px' }}>
              {children}
            </main>
          </AuthGateProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
