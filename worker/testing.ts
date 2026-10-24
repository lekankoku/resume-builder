import { AccessJwk } from './access';

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const encodeJson = (value: unknown) => base64Url(new TextEncoder().encode(JSON.stringify(value)));

export const anAccessKeyPair = async () => {
  const keys = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair;
  const kid = crypto.randomUUID();
  const jwk = { ...((await crypto.subtle.exportKey('jwk', keys.publicKey)) as JsonWebKey), kid } as AccessJwk;

  const sign = async (payload: Record<string, unknown>, header: Record<string, unknown> = { alg: 'RS256', kid }) => {
    const unsigned = `${encodeJson(header)}.${encodeJson(payload)}`;
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keys.privateKey, new TextEncoder().encode(unsigned));
    return `${unsigned}.${base64Url(new Uint8Array(signature as ArrayBuffer))}`;
  };

  return { jwk, kid, sign };
};
