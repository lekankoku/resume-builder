import { useEffect, useState } from 'react';
import { CandidateFactsRepository } from '../../application/ports/repositories';

export const useCandidateFacts = (repository: CandidateFactsRepository) => {
  const [facts, setFacts] = useState(() => repository.load());

  useEffect(() => {
    repository.save(facts);
  }, [repository, facts]);

  return { facts, setFacts };
};
