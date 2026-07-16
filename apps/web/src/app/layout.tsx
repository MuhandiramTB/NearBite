import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'NearBite',
  description: 'Trusted, always-fresh local food discovery.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="container nav-inner">
            <a href="/" className="brand">
              🍽 NearBite
            </a>
            <a href="/">Discover</a>
            <a href="/owner">My Business</a>
            <a href="/admin">Admin</a>
          </div>
        </nav>
        <main className="container" style={{ padding: '24px 16px 64px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
