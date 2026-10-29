import { useEffect, useMemo, useState } from 'react';
import { ApplicationRepository } from '../../application/ports/repositories';
import {
  ApplicationDetails,
  attachCv,
  changeStage,
  createApplication,
  CvSource,
  JobApplication,
  restoreVersion,
  saveVersion,
  updateApplicationField,
} from '../../domain/application/JobApplication';

export const useApplications = (repository: ApplicationRepository) => {
  const [applications, setApplications] = useState<JobApplication[]>(() => repository.load());

  useEffect(() => {
    repository.save(applications);
  }, [repository, applications]);

  const actions = useMemo(() => {
    const update = (id: string, change: (application: JobApplication) => JobApplication) =>
      setApplications((apps) => apps.map((application) => (application.id === id ? change(application) : application)));

    return {
      create: (details: ApplicationDetails, source: CvSource | null, stage: string) => {
        const application = createApplication(details, source, stage, new Date(), crypto.randomUUID());
        setApplications((apps) => [...apps, application]);
        return application.id;
      },
      update,
      attachCv: (id: string, source: CvSource) => update(id, (application) => ({ ...application, ...attachCv(source) })),
      updateField: (id: string, field: keyof ApplicationDetails, value: string) =>
        update(id, (application) => updateApplicationField(application, field, value)),
      changeStage: (id: string, stage: string) => update(id, (application) => changeStage(application, stage, new Date())),
      saveVersion: (id: string, note: string) =>
        update(id, (application) => saveVersion(application, note, new Date(), crypto.randomUUID())),
      restoreVersion: (id: string, versionId: string) => update(id, (application) => restoreVersion(application, versionId)),
    };
  }, []);

  return { applications, actions };
};

export type ApplicationActions = ReturnType<typeof useApplications>['actions'];
