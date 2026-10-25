import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { DocumentClient, StoredDocument } from '../../application/ports/repositories';
import { buttonClass, primaryButtonClass } from '../applications/ApplicationsView';
import PageHeader from '../shell/PageHeader';

const ACCEPTED = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg';

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const DocumentsView: React.FC<{ client: DocumentClient }> = ({ client }) => {
  const [documents, setDocuments] = useState<StoredDocument[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    client.list().then(setDocuments, (e: Error) => setError(e.message));
  }, [client]);

  const upload = async (files: FileList) => {
    setUploading(true);
    setError('');
    for (const file of Array.from(files)) {
      try {
        const stored = await client.upload(file);
        setDocuments((current) => [stored, ...(current ?? [])]);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    setUploading(false);
    if (input.current) input.current.value = '';
  };

  const remove = async (document: StoredDocument) => {
    if (!window.confirm(`Delete ${document.name}? This can't be undone.`)) return;
    try {
      await client.remove(document.id);
      setDocuments((current) => (current ?? []).filter((d) => d.id !== document.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Documents"
        subtitle={documents ? `${documents.length} stored` : 'Loading…'}
        actions={
          <>
            <input
              ref={input}
              id="document-upload"
              type="file"
              multiple
              accept={ACCEPTED}
              className="sr-only"
              onChange={(e) => e.target.files?.length && upload(e.target.files)}
            />
            <label htmlFor="document-upload" className={`${primaryButtonClass} cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
            </label>
          </>
        }
      />

      <p className="text-sm text-slate-500">PDF, Word, text, PNG or JPG, up to 20 MB each.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {documents && documents.length === 0 && <p className="text-sm text-slate-500">No documents yet.</p>}
      {documents && documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((document) => (
            <li key={document.id} className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
              <FileText size={18} className="text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <a
                  href={client.urlOf(document.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-semibold text-slate-900 truncate hover:underline"
                >
                  {document.name}
                </a>
                <p className="text-xs text-slate-500">
                  {formatSize(document.size)} · {new Date(document.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <a href={client.urlOf(document.id)} download={document.name} aria-label={`Download ${document.name}`} className={buttonClass}>
                <Download size={14} />
              </a>
              <button onClick={() => remove(document)} aria-label={`Delete ${document.name}`} className={buttonClass}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentsView;
