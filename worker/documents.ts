export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

const FILE_TYPES: Record<string, { contentType: string; inline: boolean }> = {
  pdf: { contentType: 'application/pdf', inline: true },
  png: { contentType: 'image/png', inline: true },
  jpg: { contentType: 'image/jpeg', inline: true },
  jpeg: { contentType: 'image/jpeg', inline: true },
  doc: { contentType: 'application/msword', inline: false },
  docx: { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', inline: false },
  txt: { contentType: 'text/plain; charset=utf-8', inline: true },
};

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const fileTypeOf = (name: string) => FILE_TYPES[name.split('.').pop()?.toLowerCase() ?? ''];

const toDocument = (object: R2Object) => ({
  id: object.key,
  name: object.customMetadata?.name ?? object.key,
  size: object.size,
  uploadedAt: object.customMetadata?.uploadedAt ?? object.uploaded.toISOString(),
});

export const handleDocuments = async (request: Request, bucket: R2Bucket, pathname: string): Promise<Response> => {
  if (pathname === '/api/documents') {
    if (request.method === 'GET') return listDocuments(bucket);
    if (request.method === 'POST') return uploadDocument(request, bucket);
  }

  const id = pathname.match(/^\/api\/documents\/([^/]+)$/)?.[1];
  if (id && ID_PATTERN.test(id)) {
    if (request.method === 'GET') return downloadDocument(bucket, id);
    if (request.method === 'DELETE') {
      await bucket.delete(id);
      return new Response(null, { status: 204 });
    }
    if (request.method === 'PATCH') return renameDocument(request, bucket, id);
  }

  return json({ error: 'Not found' }, 404);
};

const listDocuments = async (bucket: R2Bucket): Promise<Response> => {
  const objects: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ cursor, include: ['customMetadata'] });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return json(objects.map(toDocument).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)));
};

const uploadDocument = async (request: Request, bucket: R2Bucket): Promise<Response> => {
  const name = decodeURIComponent(request.headers.get('X-File-Name') ?? '').trim();
  const fileType = fileTypeOf(name);
  if (!name || !fileType) return json({ error: 'Only PDF, Word, text, PNG and JPG files are allowed' }, 415);

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) return json({ error: 'File is empty' }, 400);
  if (body.byteLength > MAX_DOCUMENT_BYTES) return json({ error: 'File is larger than 20 MB' }, 413);

  const id = crypto.randomUUID();
  const uploadedAt = new Date().toISOString();
  await bucket.put(id, body, { httpMetadata: { contentType: fileType.contentType }, customMetadata: { name, uploadedAt } });
  return json({ id, name, size: body.byteLength, uploadedAt }, 201);
};

const renameDocument = async (request: Request, bucket: R2Bucket, id: string): Promise<Response> => {
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const fileType = fileTypeOf(name);
  if (!name || !fileType) return json({ error: 'Only PDF, Word, text, PNG and JPG files are allowed' }, 415);

  const object = await bucket.get(id);
  if (!object) return json({ error: 'Not found' }, 404);

  const content = await object.arrayBuffer();
  const uploadedAt = object.customMetadata?.uploadedAt ?? object.uploaded.toISOString();
  await bucket.put(id, content, { httpMetadata: { contentType: fileType.contentType }, customMetadata: { name, uploadedAt } });
  return json({ id, name, size: content.byteLength, uploadedAt });
};

const downloadDocument = async (bucket: R2Bucket, id: string): Promise<Response> => {
  const object = await bucket.get(id);
  if (!object) return json({ error: 'Not found' }, 404);

  const name = object.customMetadata?.name ?? id;
  const fileType = fileTypeOf(name);
  return new Response(object.body, {
    headers: {
      'Content-Type': fileType?.contentType ?? 'application/octet-stream',
      'Content-Disposition': `${fileType?.inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(name)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
};
