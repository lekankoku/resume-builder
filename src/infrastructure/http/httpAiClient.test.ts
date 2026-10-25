import { describe, expect, it, vi } from 'vitest';
import { createHttpAiClient } from './httpAiClient';

const respond = (status: number, body?: unknown) =>
  vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }));

const aJob = () => ({ company: crypto.randomUUID(), role: crypto.randomUUID(), jobDescription: crypto.randomUUID() });

describe('httpAiClient', () => {
  it('posts the job to the analyse endpoint and returns the analysis', async () => {
    // Given
    const analysed = { analysis: { tagline: crypto.randomUUID() }, usage: { costUsd: Math.random() } };
    const fetchFn = respond(200, analysed);
    const job = aJob();

    // When
    const result = await createHttpAiClient(fetchFn).analyseJob(job);

    // Then
    expect(result).toEqual(analysed);
    expect(fetchFn).toHaveBeenCalledWith('/api/cv/analyse', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
  });

  it('posts the write request to the write endpoint and returns the written CV', async () => {
    // Given
    const written = { cv: { header: { title: crypto.randomUUID() } }, review: {}, coverLetter: null, usage: {} };
    const fetchFn = respond(200, written);
    const request = { ...aJob(), analysis: {} as never, answers: [], coverLetter: true, motivation: crypto.randomUUID() };

    // When
    const result = await createHttpAiClient(fetchFn).writeCv(request);

    // Then
    expect(result).toEqual(written);
    expect(fetchFn).toHaveBeenCalledWith('/api/cv/write', expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }));
  });

  it('surfaces the server error message when a request fails', async () => {
    // Given
    const error = crypto.randomUUID();

    // When / Then
    await expect(createHttpAiClient(respond(502, { error })).analyseJob(aJob())).rejects.toThrow(error);
  });

  it('falls back to the status when the error body is not JSON', async () => {
    await expect(createHttpAiClient(respond(500)).analyseJob(aJob())).rejects.toThrow('Analysing the job failed with 500');
  });

  it('loads the usage report', async () => {
    // Given
    const report = { entries: [], monthUsd: Math.random(), totalUsd: Math.random() };
    const fetchFn = respond(200, report);

    // When / Then
    expect(await createHttpAiClient(fetchFn).usage()).toEqual(report);
    expect(fetchFn).toHaveBeenCalledWith('/api/usage', { credentials: 'same-origin' });
  });

  it('throws when the usage report fails to load', async () => {
    await expect(createHttpAiClient(respond(503)).usage()).rejects.toThrow('Loading AI usage failed with 503');
  });
});
