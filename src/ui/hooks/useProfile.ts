import { useEffect, useState } from 'react';
import { ProfileRepository } from '../../application/ports/repositories';
import { Profile } from '../../domain/resume/Resume';

export const useProfile = (repository: ProfileRepository) => {
  const [profile, setProfile] = useState<Profile>(() => repository.load());

  useEffect(() => {
    repository.save(profile);
  }, [repository, profile]);

  const updateField = (field: keyof Profile, value: string) => setProfile((p) => ({ ...p, [field]: value }));

  return { profile, updateField };
};
