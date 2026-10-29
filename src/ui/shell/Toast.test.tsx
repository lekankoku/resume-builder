// @vitest-environment jsdom
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './Toast';

const Trigger: React.FC<{ message: string; onUndo?: () => void }> = ({ message, onUndo }) => {
  const notify = useToast();
  return <button onClick={() => notify(message, onUndo)}>Trigger</button>;
};

const renderWithToast = (message: string, onUndo?: () => void) =>
  render(
    <ToastProvider>
      <Trigger message={message} onUndo={onUndo} />
    </ToastProvider>,
  );

describe('Toast', () => {
  afterEach(() => vi.useRealTimers());

  it('shows the message and undoes the action', async () => {
    // Given
    const user = userEvent.setup();
    const message = crypto.randomUUID();
    const onUndo = vi.fn();
    renderWithToast(message, onUndo);

    // When
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    // Then
    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it('has no undo button when there is nothing to undo', async () => {
    // Given
    const user = userEvent.setup();
    const message = crypto.randomUUID();
    renderWithToast(message);

    // When
    await user.click(screen.getByRole('button', { name: 'Trigger' }));

    // Then
    expect(screen.getByRole('status')).toHaveTextContent(message);
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
  });

  it('can be dismissed', async () => {
    // Given
    const user = userEvent.setup();
    const message = crypto.randomUUID();
    renderWithToast(message, vi.fn());
    await user.click(screen.getByRole('button', { name: 'Trigger' }));

    // When
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    // Then
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it('disappears on its own after a few seconds', async () => {
    // Given
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const message = crypto.randomUUID();
    renderWithToast(message, vi.fn());
    await user.click(screen.getByRole('button', { name: 'Trigger' }));

    // When
    act(() => vi.advanceTimersByTime(6000));

    // Then
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });
});
