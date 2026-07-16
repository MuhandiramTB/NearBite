import type { ReactNode } from 'react';

export const metadata = {
  title: 'NearBite',
  description: 'Trusted, always-fresh local food discovery.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
