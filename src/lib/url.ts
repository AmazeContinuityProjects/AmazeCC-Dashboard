const REMOTE_DOMAINS = [
  'drive.google.com',
  'docs.google.com',
  'onedrive.live.com',
  'dropbox.com',
  'sharepoint.com',
  'live.com',
];

export function isRemoteUrl(url: string): boolean {
  if (!url || url === 'DIRECT_JSON') return false;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
  let hostname: string;
  try {
    hostname = new URL(candidate).hostname.toLowerCase();
  } catch {
    return false;
  }
  return REMOTE_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
}
