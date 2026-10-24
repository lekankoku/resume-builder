import { useEffect, useState } from 'react';
import { DraftRepository } from '../../application/ports/repositories';
import { ApplicationDraft, upsertDraft } from '../../domain/application/ApplicationDraft';

export const useDrafts = (repository: DraftRepository) => {
  const [drafts, setDrafts] = useState<ApplicationDraft[]>(() => repository.load());

  useEffect(() => {
    repository.save(drafts);
  }, [repository, drafts]);

  const save = (draft: ApplicationDraft) => setDrafts((current) => upsertDraft(current, draft));
  const remove = (id: string) => setDrafts((current) => current.filter((draft) => draft.id !== id));

  return { drafts, save, remove };
};
