// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import PreviewPane from './PreviewPane';

describe('PreviewPane', () => {
  it('toggles the preview open and closed on smaller screens', async () => {
    // Given
    const user = userEvent.setup();
    render(<PreviewPane><p>Preview content</p></PreviewPane>);
    const toggle = screen.getByRole('button', { name: 'Show preview and suggestions' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // When
    await user.click(toggle);

    // Then
    expect(screen.getByRole('button', { name: 'Hide preview and suggestions' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Preview content')).toBeVisible();
  });
});
