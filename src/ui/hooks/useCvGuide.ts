import { useEffect, useState } from 'react';
import { CvGuideRepository, StoredDocument } from '../../application/ports/repositories';

export const useCvGuide = (repository: CvGuideRepository) => {
  const [cvGuide, setCvGuide] = useState<StoredDocument | null>(() => repository.load());

  useEffect(() => {
    if (cvGuide) repository.save(cvGuide);
  }, [repository, cvGuide]);

  return { cvGuide, setCvGuide };
};
