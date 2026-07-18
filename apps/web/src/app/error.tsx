'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="empty" style={{ paddingTop: 80 }}>
      <div className="big">😕</div>
      <h1 className="h1">Something went wrong</h1>
      <p className="muted">An unexpected error occurred. Please try again.</p>
      <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
        <button className="btn btn-primary" onClick={reset}>Try again</button>
        <a className="btn" href="/">Back to Discover</a>
      </div>
    </div>
  );
}
