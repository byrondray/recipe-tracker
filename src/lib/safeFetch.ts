import dns from 'dns/promises';
import net from 'net';

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

function isPrivateOrLoopbackIp(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 0) return true; // "this" network
    return false;
  }
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    if (normalized === '::1') return true; // loopback
    if (normalized.startsWith('fe80:')) return true; // link-local
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
    if (normalized.startsWith('::ffff:')) {
      return isPrivateOrLoopbackIp(normalized.replace('::ffff:', ''));
    }
    return false;
  }
  return false;
}

async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError('Invalid URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only http/https URLs are allowed.');
  }

  const hostname = url.hostname;
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new UnsafeUrlError('This URL is not allowed.');
  }

  let addresses: string[];
  if (net.isIP(hostname)) {
    addresses = [hostname];
  } else {
    try {
      addresses = (await dns.lookup(hostname, { all: true })).map((a) => a.address);
    } catch {
      throw new UnsafeUrlError('Could not resolve host.');
    }
  }

  if (addresses.length === 0 || addresses.some(isPrivateOrLoopbackIp)) {
    throw new UnsafeUrlError('This URL is not allowed.');
  }

  return url;
}

/**
 * Fetches a user-supplied URL while guarding against SSRF: rejects non-http(s)
 * schemes and loopback/private/link-local (incl. cloud metadata) addresses,
 * and re-validates on every redirect hop instead of trusting `fetch`'s
 * automatic redirect handling.
 */
export async function safeFetch(
  rawUrl: string,
  init: RequestInit & { maxRedirects?: number } = {}
): Promise<Response> {
  const { maxRedirects = 5, ...rest } = init;
  let currentUrl = rawUrl;

  for (let i = 0; i <= maxRedirects; i++) {
    await assertSafeUrl(currentUrl);

    const res = await fetch(currentUrl, { ...rest, redirect: 'manual' });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) return res;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return res;
  }

  throw new UnsafeUrlError('Too many redirects.');
}
