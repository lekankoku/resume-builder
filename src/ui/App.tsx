import React, { useMemo } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { Repositories } from '../application/ports/repositories';
import { JobApplication } from '../domain/application/JobApplication';
import { CoverLetter } from '../domain/coverLetter/CoverLetter';
import { Resume } from '../domain/resume/Resume';
import ApplicationsView from './applications/ApplicationsView';
import HomeView from './applications/HomeView';
import NewApplicationWizard from './applications/NewApplicationWizard';
import DocumentWorkspace from './DocumentWorkspace';
import { ApplicationActions, useApplications } from './hooks/useApplications';
import { useStages } from './hooks/useStages';

interface AppProps {
  repositories: Repositories;
}

const App: React.FC<AppProps> = ({ repositories }) => {
  const { applications, actions } = useApplications(repositories.applications);
  const { stages, add: addStage, remove: removeStage } = useStages(repositories.stages);
  const navigate = useNavigate();
  const location = useLocation();

  const openApplications = () => navigate('/applications');
  const openApplication = (id: string) => navigate('/applications', { state: { selectedId: id } });
  const editApplicationCv = (id: string) => navigate(`/applications/${id}/cv`);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomeView
            applications={applications}
            onNewApplication={() => navigate('/applications/new')}
            onOpenApplication={openApplication}
            onEditApplicationCv={editApplicationCv}
            onOpenAllApplications={openApplications}
          />
        }
      />
      <Route
        path="/applications"
        element={
          <ApplicationsView
            applications={applications}
            actions={actions}
            stages={stages}
            initialSelectedId={location.state?.selectedId}
            onAddStage={addStage}
            onRemoveStage={(stage) => removeStage(stage, applications)}
            onNewApplication={() => navigate('/applications/new')}
            onEditApplication={editApplicationCv}
          />
        }
      />
      <Route
        path="/applications/new"
        element={
          <NewApplicationWizard
            applications={applications}
            stages={stages}
            onCreate={(details, source, stage) => openApplication(actions.create(details, source, stage))}
            onCancel={() => navigate('/')}
          />
        }
      />
      <Route
        path="/applications/:id/cv"
        element={<ApplicationWorkspace applications={applications} actions={actions} onOpenApplications={openApplications} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const ApplicationWorkspace: React.FC<{
  applications: JobApplication[];
  actions: ApplicationActions;
  onOpenApplications: () => void;
}> = ({ applications, actions, onOpenApplications }) => {
  const { id } = useParams();
  const activeApplication = applications.find((a) => a.id === id);

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

  if (!activeApplication || !applicationRepositories) {
    return <Navigate to="/applications" replace />;
  }

  return (
    <DocumentWorkspace
      key={activeApplication.id}
      repositories={applicationRepositories}
      contextLabel={[activeApplication.company, activeApplication.role].filter(Boolean).join(' — ')}
      onOpenApplications={onOpenApplications}
    />
  );
};

export default App;
