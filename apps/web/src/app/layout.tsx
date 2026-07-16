import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'NearBite — always-fresh local food',
  description: 'Trusted, always-fresh local food discovery in Sri Lanka.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="container nav-inner">
            <a href="/" className="brand">
              Near<span>Bite</span>
            </a>
            <a href="/">Discover</a>
            <a href="/owner">My Business</a>
            <a href="/admin">Admin</a>
            <a href="/signin">Sign in</a>
          </div>
        </nav>
        <main className="container" style={{ padding: '28px 20px 72px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
