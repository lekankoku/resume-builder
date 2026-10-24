import { useEffect, useState } from 'react';
import { CoverLetterRepository } from '../../application/ports/repositories';
import { CoverLetter, updateCoverLetterField } from '../../domain/coverLetter/CoverLetter';

export const useCoverLetter = (repository: CoverLetterRepository) => {
  const [coverLetter, setCoverLetter] = useState<CoverLetter>(() => repository.load());

  useEffect(() => {
    repository.save(coverLetter);
  }, [repository, coverLetter]);

  const updateField = (field: keyof CoverLetter, value: string) =>
    setCoverLetter((letter) => updateCoverLetterField(letter, field, value));

  return { coverLetter, updateField };
};
