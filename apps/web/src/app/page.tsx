export default function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: 640 }}>
      <h1>NearBite</h1>
      <p>Trusted, always-fresh local food discovery.</p>
      <p style={{ color: '#666' }}>
        M0 foundation shell. Health check: <a href="/api/v1/health">/api/v1/health</a>
      </p>
    </main>
  );
}
