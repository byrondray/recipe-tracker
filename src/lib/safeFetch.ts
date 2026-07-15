import dns from 'dns/promises';
import net from 'net';
import { Agent, fetch as undiciFetch } from 'undici';

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

function isPrivateOrLoopbackIpv4(address: string): boolean {
  const [a, b] = address.split('.').map(Number);
  if (a === 127) return true; // loopback
  if (a === 10) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 0) return true; // "this" network
  return false;
}

/** Extracts the dotted-decimal IPv4 address embedded in an IPv4-mapped IPv6
 * address, whether written in hex (::ffff:7f00:1) or dotted (::ffff:127.0.0.1) form. */
function extractIpv4MappedAddress(normalized: string): string | null {
  const dotted = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return dotted[1];

  const hex = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);
    return [
      (high >> 8) & 0xff,
      high & 0xff,
      (low >> 8) & 0xff,
      low & 0xff,
    ].join('.');
  }

  return null;
}

function isPrivateOrLoopbackIp(address: string): boolean {
  if (net.isIPv4(address)) {
    return isPrivateOrLoopbackIpv4(address);
  }
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    if (normalized === '::1') return true; // loopback
    if (normalized.startsWith('fe80:')) return true; // link-local
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
    const mapped = extractIpv4MappedAddress(normalized);
    if (mapped) return isPrivateOrLoopbackIpv4(mapped);
    return false;
  }
  return false;
}

async function assertSafeUrl(rawUrl: string): Promise<{ url: URL; pinnedAddress: string }> {
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

  // Pin the exact validated address for the connection so a second DNS
  // lookup performed by fetch() itself (which could return a different,
  // rebound address) can't bypass the check above.
  return { url, pinnedAddress: addresses[0] };
}

/**
 * Fetches a user-supplied URL while guarding against SSRF: rejects non-http(s)
 * schemes and loopback/private/link-local (incl. cloud metadata) addresses,
 * re-validates on every redirect hop instead of trusting `fetch`'s automatic
 * redirect handling, and pins the TCP connection to the exact address that
 * was validated (via a custom `Agent` dns lookup) so a second, independent
 * DNS resolution inside the fetch implementation can't be rebound to a
 * different (unsafe) address between validation and connection.
 */
export async function safeFetch(
  rawUrl: string,
  init: RequestInit & { maxRedirects?: number } = {}
): Promise<Response> {
  const { maxRedirects = 5, ...rest } = init;
  let currentUrl = rawUrl;

  for (let i = 0; i <= maxRedirects; i++) {
    const { pinnedAddress } = await assertSafeUrl(currentUrl);

    const family = net.isIPv6(pinnedAddress) ? 6 : 4;
    const dispatcher = new Agent({
      connect: {
        lookup: (_hostname, opts, callback) => {
          if (opts.all) {
            callback(null, [{ address: pinnedAddress, family }]);
          } else {
            callback(null, pinnedAddress, family);
          }
        },
      },
    });

    const res = (await undiciFetch(currentUrl, {
      ...rest,
      redirect: 'manual',
      dispatcher,
    } as Parameters<typeof undiciFetch>[1])) as unknown as Response;

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
