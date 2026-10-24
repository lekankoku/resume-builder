import { useEffect, useState } from 'react';
import { TargetCompanyRepository } from '../../application/ports/repositories';

export const useTargetCompany = (repository: TargetCompanyRepository) => {
  const [targetCompany, setTargetCompany] = useState<string>(() => repository.load());

  useEffect(() => {
    repository.save(targetCompany);
  }, [repository, targetCompany]);

  return { targetCompany, setTargetCompany };
};
