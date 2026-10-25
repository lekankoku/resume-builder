// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AiClient, DocumentClient, StoredDocument } from '../../application/ports/repositories';
import { UsageReport } from '../../domain/application/cvGeneration';
import { AiUsageSettings, CvGuideSettings, JobBankSettings } from './SettingsView';

const JobBankHarness = ({ onChange }: { onChange: (value: string) => void }) => {
  const [jobBank, setJobBank] = useState('');
  return (
    <JobBankSettings
      jobBank={jobBank}
      onChange={(value) => {
        setJobBank(value);
        onChange(value);
      }}
    />
  );
};

describe('Settings', () => {
  describe('JobBankSettings', () => {
    it('saves what is typed and shows its length', async () => {
      // Given
      const user = userEvent.setup();
      const onChange = vi.fn();
      const text = 'Kotlin at N26';
      render(<JobBankHarness onChange={onChange} />);

      // When
      await user.type(screen.getByLabelText('Job bank'), text);

      // Then
      expect(onChange).toHaveBeenLastCalledWith(text);
      expect(screen.getByText(`${text.length} characters`)).toBeVisible();
    });
  });

  describe('CvGuideSettings', () => {
    const aStoredDocument = (): StoredDocument => ({ id: crypto.randomUUID(), name: `${crypto.randomUUID()}.pdf`, size: 1, uploadedAt: new Date().toISOString() });
    const documentsWith = (upload: DocumentClient['upload']): DocumentClient => ({
      list: vi.fn(),
      upload,
      remove: vi.fn(),
      urlOf: (id) => `/api/documents/${id}`,
    });

    it('uploads the chosen PDF and saves it as the guide', async () => {
      // Given
      const user = userEvent.setup();
      const stored = aStoredDocument();
      const upload = vi.fn(async () => stored);
      const onChange = vi.fn();
      const file = new File(['%PDF'], 'guide.pdf', { type: 'application/pdf' });
      render(<CvGuideSettings cvGuide={null} documents={documentsWith(upload)} onChange={onChange} />);

      // When
      await user.upload(screen.getByLabelText('Upload guide PDF'), file);

      // Then
      expect(upload).toHaveBeenCalledWith(file);
      expect(onChange).toHaveBeenCalledWith(stored);
    });

    it('links to the current guide and offers to replace it', () => {
      // Given
      const guide = aStoredDocument();

      // When
      render(<CvGuideSettings cvGuide={guide} documents={documentsWith(vi.fn())} onChange={vi.fn()} />);

      // Then
      expect(screen.getByRole('link', { name: guide.name })).toHaveAttribute('href', `/api/documents/${guide.id}`);
      expect(screen.getByLabelText('Replace guide PDF')).toBeVisible();
    });

    it('shows the error and keeps the guide when the upload fails', async () => {
      // Given
      const user = userEvent.setup();
      const message = crypto.randomUUID();
      const onChange = vi.fn();
      render(<CvGuideSettings cvGuide={null} documents={documentsWith(async () => Promise.reject(new Error(message)))} onChange={onChange} />);

      // When
      await user.upload(screen.getByLabelText('Upload guide PDF'), new File(['%PDF'], 'guide.pdf'));

      // Then
      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('AiUsageSettings', () => {
    const clientWith = (usage: AiClient['usage']): AiClient => ({ analyseJob: vi.fn(), writeCv: vi.fn(), usage });

    it('shows the monthly and all-time totals and each generation', async () => {
      // Given
      const report: UsageReport = {
        monthUsd: 0.42,
        totalUsd: 3.1,
        entries: [
          {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            provider: 'openai',
            model: crypto.randomUUID(),
            company: crypto.randomUUID(),
            role: crypto.randomUUID(),
            inputTokens: 8123,
            cachedInputTokens: 2000,
            outputTokens: 4500,
            costUsd: 0.31,
          },
        ],
      };

      // When
      render(<AiUsageSettings client={clientWith(async () => report)} />);

      // Then
      expect(await screen.findByText('$0.42')).toBeVisible();
      expect(screen.getByText('$3.10')).toBeVisible();
      const [entry] = report.entries;
      const row = screen.getByRole('row', { name: new RegExp(entry.model) });
      expect(row).toHaveTextContent(`${entry.company} — ${entry.role}`);
      expect(row).toHaveTextContent('8,123 / 2,000 / 4,500');
      expect(row).toHaveTextContent('$0.31');
    });

    it('says so when nothing has been generated yet', async () => {
      // Given / When
      render(<AiUsageSettings client={clientWith(async () => ({ entries: [], monthUsd: 0, totalUsd: 0 }))} />);

      // Then
      expect(await screen.findByText('No CVs generated yet.')).toBeVisible();
    });

    it('shows the error when usage cannot be loaded', async () => {
      // Given
      const message = crypto.randomUUID();

      // When
      render(<AiUsageSettings client={clientWith(async () => Promise.reject(new Error(message)))} />);

      // Then
      expect(await screen.findByRole('alert')).toHaveTextContent(message);
    });
  });
});
