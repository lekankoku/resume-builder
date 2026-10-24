import React, { useMemo, useSyncExternalStore } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { Repositories, SaveStatusSource } from '../application/ports/repositories';
import { ApplicationDraft } from '../domain/application/ApplicationDraft';
import { JobApplication } from '../domain/application/JobApplication';
import { CoverLetter } from '../domain/coverLetter/CoverLetter';
import { Profile, Resume } from '../domain/resume/Resume';
import ApplicationsView from './applications/ApplicationsView';
import HomeView from './applications/HomeView';
import NewApplicationWizard from './applications/NewApplicationWizard';
import DocumentWorkspace from './DocumentWorkspace';
import { ApplicationActions, useApplications } from './hooks/useApplications';
import { useDrafts } from './hooks/useDrafts';
import { useProfile } from './hooks/useProfile';
import { useStages } from './hooks/useStages';
import SettingsView from './settings/SettingsView';

interface AppProps {
  repositories: Repositories;
  saveStatus: SaveStatusSource;
  onRetrySave: () => void;
}

const App: React.FC<AppProps> = ({ repositories, saveStatus, onRetrySave }) => {
  const status = useSyncExternalStore(saveStatus.subscribe, saveStatus.get);
  const { applications, actions } = useApplications(repositories.applications);
  const { stages, add: addStage, remove: removeStage } = useStages(repositories.stages);
  const { drafts, save: saveDraft, remove: removeDraft } = useDrafts(repositories.drafts);
  const { profile, updateField: updateProfileField } = useProfile(repositories.profile);
  const navigate = useNavigate();
  const location = useLocation();

  const openApplications = () => navigate('/applications');
  const openApplication = (id: string) => navigate('/applications', { state: { selectedId: id } });
  const editApplicationCv = (id: string) => navigate(`/applications/${id}/cv`);

  const wizard = (draft?: ApplicationDraft) => (
    <NewApplicationWizard
      key={draft?.id ?? 'new'}
      applications={applications}
      stages={stages}
      profile={profile}
      draft={draft}
      onSaveDraft={saveDraft}
      onCreate={(details, source, stage, draftId) => {
        if (draftId) removeDraft(draftId);
        openApplication(actions.create(details, source, stage));
      }}
      onCancel={() => navigate('/')}
    />
  );

  return (
    <>
      {status === 'error' && (
        <div role="alert" className="no-print fixed bottom-6 right-6 z-[100] flex items-center gap-4 px-5 py-3 bg-red-600 text-white rounded-xl shadow-lg text-sm">
          Couldn't save to the server.
          <button onClick={onRetrySave} className="px-3 py-1 bg-white text-red-600 font-bold rounded-lg text-[10px] uppercase tracking-widest">
            Retry
          </button>
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            <HomeView
              applications={applications}
              drafts={drafts}
              onOpenDraft={(id) => navigate(`/drafts/${id}`)}
              onDiscardDraft={removeDraft}
              onNewApplication={() => navigate('/applications/new')}
              onOpenSettings={() => navigate('/settings')}
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
              profile={profile}
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
          element={wizard()}
        />
        <Route
          path="/settings"
          element={<SettingsView profile={profile} onChange={updateProfileField} onBack={() => navigate('/')} />}
        />
        <Route path="/drafts/:id" element={<DraftRoute drafts={drafts} wizard={wizard} />} />
        <Route
          path="/applications/:id/cv"
          element={
            <ApplicationWorkspace
              applications={applications}
              actions={actions}
              profile={profile}
              onOpenApplications={openApplications}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const DraftRoute: React.FC<{
  drafts: ApplicationDraft[];
  wizard: (draft: ApplicationDraft) => React.ReactNode;
}> = ({ drafts, wizard }) => {
  const { id } = useParams();
  const draft = drafts.find((d) => d.id === id);
  return draft ? wizard(draft) : <Navigate to="/" replace />;
};

const ApplicationWorkspace: React.FC<{
  applications: JobApplication[];
  actions: ApplicationActions;
  profile: Profile;
  onOpenApplications: () => void;
}> = ({ applications, actions, profile, onOpenApplications }) => {
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
      profile={profile}
      contextLabel={[activeApplication.company, activeApplication.role].filter(Boolean).join(' — ')}
      onOpenApplications={onOpenApplications}
    />
  );
};

export default App;
