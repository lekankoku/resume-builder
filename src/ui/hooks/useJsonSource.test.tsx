// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Resume } from '../../domain/resume/Resume';
import { aResume } from '../../testing/resumeFixture';
import { useJsonSource } from './useJsonSource';

const renderSource = (resume: Resume, setResume = vi.fn()) =>
  renderHook(({ resume }) => useJsonSource(resume, setResume), { initialProps: { resume } });

describe('useJsonSource', () => {
  it('follows outside changes to the CV while the JSON is untouched', () => {
    // Given
    const { result, rerender } = renderSource(aResume());
    const changed = aResume();

    // When
    rerender({ resume: changed });

    // Then
    expect(result.current.jsonInput).toBe(JSON.stringify(changed, null, 2));
  });

  it('keeps unapplied JSON edits when the CV changes elsewhere', () => {
    // Given
    const { result, rerender } = renderSource(aResume());
    const edit = crypto.randomUUID();
    act(() => result.current.setJsonInput(edit));

    // When
    rerender({ resume: aResume() });

    // Then
    expect(result.current.jsonInput).toBe(edit);
  });

  it('reports invalid JSON without changing the CV', () => {
    // Given
    const setResume = vi.fn();
    const { result } = renderSource(aResume(), setResume);
    act(() => result.current.setJsonInput('{ not json'));

    // When
    act(() => result.current.applyJson());

    // Then
    expect(result.current.jsonError).not.toBeNull();
    expect(setResume).not.toHaveBeenCalled();
  });

  it('applies valid JSON and follows the CV again afterwards', () => {
    // Given
    const setResume = vi.fn();
    const { result, rerender } = renderSource(aResume(), setResume);
    const imported = aResume();
    act(() => result.current.setJsonInput(JSON.stringify(imported)));

    // When
    act(() => result.current.applyJson());
    rerender({ resume: imported });

    // Then
    expect(setResume.mock.lastCall![0].personal.title).toBe(imported.personal.title);
    expect(result.current.jsonInput).toBe(JSON.stringify(imported, null, 2));
  });
});
