import React, { useMemo, useState } from 'react';
import { Repositories } from '../application/ports/repositories';
import { CoverLetter } from '../domain/coverLetter/CoverLetter';
import { Resume } from '../domain/resume/Resume';
import ApplicationsView from './applications/ApplicationsView';
import DocumentWorkspace from './DocumentWorkspace';
import { useApplications } from './hooks/useApplications';
import { useStages } from './hooks/useStages';

interface AppProps {
  repositories: Repositories;
}

type View = { name: 'applications' } | { name: 'master' } | { name: 'application'; id: string };

const App: React.FC<AppProps> = ({ repositories }) => {
  const { applications, actions } = useApplications(repositories.applications);
  const { stages, add: addStage, remove: removeStage } = useStages(repositories.stages);
  const [view, setView] = useState<View>({ name: 'master' });

  const openApplications = () => setView({ name: 'applications' });
  const activeApplication = view.name === 'application' ? applications.find((a) => a.id === view.id) : undefined;

  const applicationRepositories = useMemo(() => {
    if (!activeApplication) return null;
    const { id } = activeApplication;
    return {
      resume: {
        load: () => activeApplication.resume,
        save: (resume: Resume) => actions.update(id, (a) => ({ ...a, resume })),
      },
      coverLetter: {
        load: () => activeApplication.coverLetter,
        save: (coverLetter: CoverLetter) => actions.update(id, (a) => ({ ...a, coverLetter })),
      },
      targetCompany: {
        load: () => activeApplication.company,
        save: (company: string) => actions.updateField(id, 'company', company),
      },
    };
  }, [activeApplication?.id]);

  if (view.name === 'master') {
    return (
      <DocumentWorkspace
        key="master"
        repositories={repositories}
        contextLabel="Master CV"
        onOpenApplications={openApplications}
      />
    );
  }

  if (activeApplication && applicationRepositories) {
    return (
      <DocumentWorkspace
        key={activeApplication.id}
        repositories={applicationRepositories}
        contextLabel={[activeApplication.company, activeApplication.role].filter(Boolean).join(' — ')}
        onOpenApplications={openApplications}
      />
    );
  }

  return (
    <ApplicationsView
      applications={applications}
      actions={actions}
      stages={stages}
      onAddStage={addStage}
      onRemoveStage={(stage) => removeStage(stage, applications)}
      loadMasterCv={() => ({ resume: repositories.resume.load(), coverLetter: repositories.coverLetter.load() })}
      onEditMaster={() => setView({ name: 'master' })}
      onEditApplication={(id) => setView({ name: 'application', id })}
    />
  );
};

export default App;
