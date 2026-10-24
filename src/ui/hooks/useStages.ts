import { useEffect, useState } from 'react';
import { StageRepository } from '../../application/ports/repositories';
import { JobApplication } from '../../domain/application/JobApplication';
import { addStage, removeStage } from '../../domain/application/stages';

export const useStages = (repository: StageRepository) => {
  const [stages, setStages] = useState<string[]>(() => repository.load());

  useEffect(() => {
    repository.save(stages);
  }, [repository, stages]);

  const add = (name: string) => setStages((current) => addStage(current, name));
  const remove = (name: string, applications: JobApplication[]) =>
    setStages((current) => removeStage(current, name, applications));

  return { stages, add, remove };
};
