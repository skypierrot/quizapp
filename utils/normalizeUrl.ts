export function normalizeUrl(url: string): string {
  return url.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
} 