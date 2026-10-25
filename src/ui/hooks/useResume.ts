import { useEffect, useMemo, useState } from 'react';
import { ResumeRepository } from '../../application/ports/repositories';
import { BulletSection, Layout, ListSection, ListSectionItem, PersonalInfo, Position, Resume } from '../../domain/resume/Resume';
import {
  addBullet,
  addCrossFunctionalBullet,
  addEarlierPosition,
  addItem,
  moveItem,
  removeBullet,
  removeCrossFunctionalBullet,
  removeEarlierPosition,
  removeItem,
  updateBullet,
  updateCrossFunctionalBullet,
  updateCrossFunctionalTitle,
  updateEarlierPosition,
  updateItemField,
  updateLayout,
  updatePersonalField,
} from '../../domain/resume/resumeOperations';

export const createResumeActions = (setResume: (change: (resume: Resume) => Resume) => void) => ({
  updatePersonal: (field: keyof PersonalInfo, value: string) => setResume((r) => updatePersonalField(r, field, value)),
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
  updateLayout: (layout: Layout) => setResume((r) => updateLayout(r, layout)),
  addEarlierPosition: (index: number) => setResume((r) => addEarlierPosition(r, index)),
  updateEarlierPosition: (index: number, positionIndex: number, field: keyof Position, value: string) =>
    setResume((r) => updateEarlierPosition(r, index, positionIndex, field, value)),
  removeEarlierPosition: (index: number, positionIndex: number) => setResume((r) => removeEarlierPosition(r, index, positionIndex)),
  updateCrossFunctionalTitle: (title: string) => setResume((r) => updateCrossFunctionalTitle(r, title)),
  addCrossFunctionalBullet: () => setResume((r) => addCrossFunctionalBullet(r)),
  updateCrossFunctionalBullet: (bulletIndex: number, value: string) => setResume((r) => updateCrossFunctionalBullet(r, bulletIndex, value)),
  removeCrossFunctionalBullet: (bulletIndex: number) => setResume((r) => removeCrossFunctionalBullet(r, bulletIndex)),
});

export const useResume = (repository: ResumeRepository) => {
  const [resume, setResume] = useState<Resume>(() => repository.load());

  useEffect(() => {
    repository.save(resume);
  }, [repository, resume]);

  const actions = useMemo(() => createResumeActions(setResume), []);

  return { resume, setResume, actions };
};

export type ResumeActions = ReturnType<typeof createResumeActions>;
