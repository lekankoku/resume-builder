import React, { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, Pencil, Trash2, Upload, X } from 'lucide-react';
import { DocumentClient, StoredDocument } from '../../application/ports/repositories';
import { matchesQuery } from '../../domain/application/search';
import { buttonClass, primaryButtonClass } from '../applications/ApplicationsView';
import PageHeader from '../shell/PageHeader';
import ViewSearch, { useViewQuery } from '../shell/ViewSearch';

const ACCEPTED = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg';

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const previewOf = (name: string) => {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg'].includes(extension)) return 'image';
  if (['pdf', 'txt'].includes(extension)) return 'frame';
  return null;
};

const DocumentsView: React.FC<{ client: DocumentClient }> = ({ client }) => {
  const [documents, setDocuments] = useState<StoredDocument[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewing, setPreviewing] = useState<StoredDocument | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [query, setQuery] = useViewQuery();
  const visible = (documents ?? []).filter((d) => matchesQuery(query, d.name));
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

  const rename = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!renaming) return;
    try {
      const renamed = await client.rename(renaming.id, renaming.name);
      setDocuments((current) => (current ?? []).map((d) => (d.id === renamed.id ? renamed : d)));
      setRenaming(null);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
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
        <>
        <ViewSearch label="Search documents" query={query} onChange={setQuery} />
        {visible.length === 0 && <p className="text-sm text-slate-500">No documents match your search.</p>}
        <ul className="space-y-2">
          {visible.map((document) => (
            <li key={document.id} className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
              <FileText size={18} className="text-slate-400 shrink-0" />
              {renaming?.id === document.id ? (
                <form onSubmit={rename} className="flex flex-1 min-w-0 items-center gap-2">
                  <input
                    aria-label="Document name"
                    value={renaming.name}
                    onChange={(e) => setRenaming({ id: document.id, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Escape' && setRenaming(null)}
                    autoFocus
                    className="flex-1 min-w-0 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button type="submit" className={primaryButtonClass}>
                    Save
                  </button>
                  <button type="button" onClick={() => setRenaming(null)} className={buttonClass}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
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
                  <button onClick={() => setRenaming({ id: document.id, name: document.name })} aria-label={`Rename ${document.name}`} className={buttonClass}>
                    <Pencil size={14} />
                  </button>
                </>
              )}
              {previewOf(document.name) && (
                <button onClick={() => setPreviewing(document)} aria-label={`Preview ${document.name}`} className={buttonClass}>
                  <Eye size={14} />
                </button>
              )}
              <a href={client.urlOf(document.id)} download={document.name} aria-label={`Download ${document.name}`} className={buttonClass}>
                <Download size={14} />
              </a>
              <button onClick={() => remove(document)} aria-label={`Delete ${document.name}`} className={buttonClass}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
        </>
      )}

      {previewing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewing.name}`}
          onClick={() => setPreviewing(null)}
          onKeyDown={(e) => e.key === 'Escape' && setPreviewing(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6"
        >
          <div onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <p className="flex-1 min-w-0 truncate text-sm font-semibold text-slate-900">{previewing.name}</p>
              <button onClick={() => setPreviewing(null)} aria-label="Close preview" autoFocus className={buttonClass}>
                <X size={14} />
              </button>
            </div>
            {previewOf(previewing.name) === 'image' ? (
              <img src={client.urlOf(previewing.id)} alt={previewing.name} className="min-h-0 flex-1 object-contain" />
            ) : (
              <iframe src={client.urlOf(previewing.id)} title={previewing.name} className="min-h-0 flex-1 w-full" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsView;
