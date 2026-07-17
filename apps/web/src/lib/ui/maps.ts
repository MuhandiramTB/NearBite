/** Platform-aware maps deep-links (spec §14). Detects OS and opens the right app. */

function platform(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

/** Open the location in the platform's maps app (view). */
export function openInMaps(lat: number, lng: number, label?: string) {
  const q = encodeURIComponent(label ?? `${lat},${lng}`);
  const p = platform();
  let url: string;
  if (p === 'ios') url = `maps://?q=${q}&ll=${lat},${lng}`;
  else if (p === 'android') url = `geo:${lat},${lng}?q=${lat},${lng}(${q})`;
  else url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  window.open(url, '_blank');
}

/** Turn-by-turn directions to the location. */
export function getDirections(lat: number, lng: number) {
  const p = platform();
  let url: string;
  if (p === 'ios') url = `maps://?daddr=${lat},${lng}&dirflg=d`;
  else url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
}
