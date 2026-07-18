export default function NotFound() {
  return (
    <div className="empty" style={{ paddingTop: 80 }}>
      <div className="big">🍽️</div>
      <h1 className="h1">Page not found</h1>
      <p className="muted">We couldn’t find that page. It may have moved or never existed.</p>
      <a className="btn btn-primary" href="/" style={{ marginTop: 12 }}>
        Back to Discover
      </a>
    </div>
  );
}
