import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAccessJwks, verifyAccessJwt } from './access';
import { anAccessKeyPair } from './testing';

const config = () => ({ teamDomain: `${crypto.randomUUID()}.cloudflareaccess.com`, aud: crypto.randomUUID() });
const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;

describe('verifyAccessJwt', () => {
  it('accepts a token signed by a published key for the configured audience and issuer', async () => {
    const { jwk, sign } = await anAccessKeyPair();
    const { teamDomain, aud } = config();
    const token = await sign({ aud: [aud], iss: `https://${teamDomain}`, exp: inAnHour() });

    expect(await verifyAccessJwt(token, { teamDomain, aud }, async () => [jwk])).toBe(true);
  });

  it.each([
    ['another audience', (teamDomain: string) => ({ aud: [crypto.randomUUID()], iss: `https://${teamDomain}`, exp: inAnHour() })],
    ['another issuer', (_: string, aud: string) => ({ aud: [aud], iss: `https://${crypto.randomUUID()}`, exp: inAnHour() })],
    ['an expired token', (teamDomain: string, aud: string) => ({ aud, iss: `https://${teamDomain}`, exp: Math.floor(Date.now() / 1000) - 1 })],
    ['no expiry', (teamDomain: string, aud: string) => ({ aud, iss: `https://${teamDomain}` })],
  ])('rejects %s', async (_, payload) => {
    const { jwk, sign } = await anAccessKeyPair();
    const { teamDomain, aud } = config();
    const token = await sign(payload(teamDomain, aud));

    expect(await verifyAccessJwt(token, { teamDomain, aud }, async () => [jwk])).toBe(false);
  });

  it('rejects a token signed by a key that is not published', async () => {
    const published = await anAccessKeyPair();
    const attacker = await anAccessKeyPair();
    const { teamDomain, aud } = config();
    const token = await attacker.sign(
      { aud: [aud], iss: `https://${teamDomain}`, exp: inAnHour() },
      { alg: 'RS256', kid: published.kid },
    );

    expect(await verifyAccessJwt(token, { teamDomain, aud }, async () => [published.jwk])).toBe(false);
  });

  it('rejects a token whose key id is unknown', async () => {
    const { jwk, sign } = await anAccessKeyPair();
    const { teamDomain, aud } = config();
    const token = await sign({ aud: [aud], iss: `https://${teamDomain}`, exp: inAnHour() }, { alg: 'RS256', kid: crypto.randomUUID() });

    expect(await verifyAccessJwt(token, { teamDomain, aud }, async () => [jwk])).toBe(false);
  });

  it('rejects an unsigned token', async () => {
    const { jwk, kid, sign } = await anAccessKeyPair();
    const { teamDomain, aud } = config();
    const [, payload] = (await sign({ aud: [aud], iss: `https://${teamDomain}`, exp: inAnHour() })).split('.');
    const header = btoa(JSON.stringify({ alg: 'none', kid })).replace(/=+$/, '');

    expect(await verifyAccessJwt(`${header}.${payload}.`, { teamDomain, aud }, async () => [jwk])).toBe(false);
  });

  it.each(['', 'not-a-jwt', 'a.b.c'])('rejects malformed token %j', async (token) => {
    const { jwk } = await anAccessKeyPair();

    expect(await verifyAccessJwt(token, config(), async () => [jwk])).toBe(false);
  });
});

describe('fetchAccessJwks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the published keys once per team domain', async () => {
    const { jwk } = await anAccessKeyPair();
    const teamDomain = `${crypto.randomUUID()}.cloudflareaccess.com`;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ keys: [jwk] })));
    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchAccessJwks(teamDomain)).toEqual([jwk]);
    expect(await fetchAccessJwks(teamDomain)).toEqual([jwk]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`https://${teamDomain}/cdn-cgi/access/certs`);
  });

  it('fetches again after a failed fetch', async () => {
    const { jwk } = await anAccessKeyPair();
    const teamDomain = `${crypto.randomUUID()}.cloudflareaccess.com`;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ keys: [jwk] })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAccessJwks(teamDomain)).rejects.toThrow('Fetching Access certs failed with 500');
    expect(await fetchAccessJwks(teamDomain)).toEqual([jwk]);
  });
});
