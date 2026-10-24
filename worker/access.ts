export interface AccessConfig {
  teamDomain: string;
  aud: string;
}

export type AccessJwk = JsonWebKey & { kid: string };
export type FetchJwks = (teamDomain: string) => Promise<AccessJwk[]>;

const jwksCache = new Map<string, Promise<AccessJwk[]>>();

export const fetchAccessJwks: FetchJwks = (teamDomain) => {
  const cached = jwksCache.get(teamDomain);
  if (cached) return cached;
  const keys = fetch(`https://${teamDomain}/cdn-cgi/access/certs`)
    .then((response) => {
      if (!response.ok) throw new Error(`Fetching Access certs failed with ${response.status}`);
      return response.json<{ keys: AccessJwk[] }>();
    })
    .then((body) => body.keys);
  keys.catch(() => jwksCache.delete(teamDomain));
  jwksCache.set(teamDomain, keys);
  return keys;
};

const base64UrlDecode = (part: string): Uint8Array =>
  Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

const decodeJson = (part: string) => JSON.parse(new TextDecoder().decode(base64UrlDecode(part)));

export const verifyAccessJwt = async (
  token: string,
  config: AccessConfig,
  fetchJwks: FetchJwks,
  now: number = Date.now(),
): Promise<boolean> => {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [headerPart, payloadPart, signaturePart] = parts;
  try {
    const header = decodeJson(headerPart);
    const payload = decodeJson(payloadPart);
    if (header.alg !== 'RS256') return false;
    const jwk = (await fetchJwks(config.teamDomain)).find((key) => key.kid === header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const signed = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlDecode(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`),
    );
    const audiences: unknown[] = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    return (
      signed &&
      audiences.includes(config.aud) &&
      payload.iss === `https://${config.teamDomain}` &&
      typeof payload.exp === 'number' &&
      payload.exp * 1000 > now
    );
  } catch {
    return false;
  }
};
