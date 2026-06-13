export function reportWebVitals() {
  if ('web-vital' in window) return;
  import('web-vitals').then(({ onLCP, onINP, onCLS }) => {
    onLCP(console.log);
    onINP(console.log);
    onCLS(console.log);
  });
}
