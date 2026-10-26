import { describe, expect, it, vi } from 'vitest';
import { createCoverLetter } from '../../domain/coverLetter/CoverLetter';
import { aResume } from '../../testing/resumeFixture';
import { createHttpAiClient } from './httpAiClient';

const respond = (status: number, body?: unknown) =>
  vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }));

const aJob = () => ({ company: crypto.randomUUID(), role: crypto.randomUUID(), jobDescription: crypto.randomUUID() });
const aRequest = () => ({ ...aJob(), resume: aResume(), coverLetter: createCoverLetter(new Date()) });

describe('httpAiClient', () => {
  it('posts the CV and job to the suggest endpoint and returns the suggestions', async () => {
    // Given
    const suggestions = { summary: crypto.randomUUID(), gaps: [], questions: [], suggestions: [], usage: {} };
    const fetchFn = respond(200, suggestions);
    const request = { ...aJob(), resume: aResume(), coverLetter: createCoverLetter(new Date()) };

    // When
    const result = await createHttpAiClient(fetchFn).suggest(request);

    // Then
    expect(result).toEqual(suggestions);
    expect(fetchFn).toHaveBeenCalledWith('/api/cv/suggest', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  });

  it('surfaces the server error message when a request fails', async () => {
    // Given
    const error = crypto.randomUUID();

    // When / Then
    await expect(createHttpAiClient(respond(502, { error })).suggest(aRequest())).rejects.toThrow(error);
  });

  it('falls back to the status when the error body is not JSON', async () => {
    await expect(createHttpAiClient(respond(500)).suggest(aRequest())).rejects.toThrow('Getting suggestions failed with 500');
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
