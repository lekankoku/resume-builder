import { useEffect, useMemo, useState } from 'react';
import { ResumeRepository } from '../../application/ports/repositories';
import { BulletSection, ListSection, ListSectionItem, PersonalInfo, Resume } from '../../domain/resume/Resume';
import {
  addBullet,
  addItem,
  moveItem,
  removeBullet,
  removeItem,
  updateBullet,
  updateItemField,
  updatePersonalField,
} from '../../domain/resume/resumeOperations';

export const useResume = (repository: ResumeRepository) => {
  const [resume, setResume] = useState<Resume>(() => repository.load());

  useEffect(() => {
    repository.save(resume);
  }, [repository, resume]);

  const actions = useMemo(
    () => ({
      updatePersonal: (field: keyof PersonalInfo, value: string) =>
        setResume((r) => updatePersonalField(r, field, value)),
      addItem: (section: ListSection) => setResume((r) => addItem(r, section)),
      removeItem: (section: ListSection, index: number) => setResume((r) => removeItem(r, section, index)),
      moveItem: (section: ListSection, from: number, to: number) => setResume((r) => moveItem(r, section, from, to)),
      updateItemField: <S extends ListSection>(section: S, index: number, field: keyof ListSectionItem<S>, value: string) =>
        setResume((r) => updateItemField(r, section, index, field, value)),
      addBullet: (section: BulletSection, index: number) => setResume((r) => addBullet(r, section, index)),
      updateBullet: (section: BulletSection, index: number, bulletIndex: number, value: string) =>
        setResume((r) => updateBullet(r, section, index, bulletIndex, value)),
      removeBullet: (section: BulletSection, index: number, bulletIndex: number) =>
        setResume((r) => removeBullet(r, section, index, bulletIndex)),
    }),
    [],
  );

  return { resume, setResume, actions };
};

export type ResumeActions = ReturnType<typeof useResume>['actions'];
