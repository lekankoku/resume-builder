import { useEffect, useState } from 'react';
import { JobBankRepository } from '../../application/ports/repositories';

export const useJobBank = (repository: JobBankRepository) => {
  const [jobBank, setJobBank] = useState(() => repository.load());

  useEffect(() => {
    repository.save(jobBank);
  }, [repository, jobBank]);

  return { jobBank, setJobBank };
};
