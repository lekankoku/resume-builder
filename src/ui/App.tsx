import React from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router';
import { Repositories, SaveStatusSource } from '../application/ports/repositories';
import { ApplicationDraft } from '../domain/application/ApplicationDraft';
import ApplicationPage, { OverviewTab, VersionsTab } from './applications/ApplicationPage';
import ApplicationsView from './applications/ApplicationsView';
import HomeView from './applications/HomeView';
import NewApplicationWizard from './applications/NewApplicationWizard';
import { CoverLetterTab, CvTab } from './DocumentWorkspace';
import { useApplications } from './hooks/useApplications';
import { useDrafts } from './hooks/useDrafts';
import { useProfile } from './hooks/useProfile';
import { useStages } from './hooks/useStages';
import PreviewPage from './preview/PreviewPage';
import SettingsView, { ProfileSettings, StageSettings } from './settings/SettingsView';
import AppShell from './shell/AppShell';

interface AppProps {
  repositories: Repositories;
  saveStatus: SaveStatusSource;
  onRetrySave: () => void;
}

const App: React.FC<AppProps> = ({ repositories, saveStatus, onRetrySave }) => {
  const { applications, actions } = useApplications(repositories.applications);
  const { stages, add: addStage, remove: removeStage } = useStages(repositories.stages);
  const { drafts, save: saveDraft, remove: removeDraft } = useDrafts(repositories.drafts);
  const { profile, updateField: updateProfileField } = useProfile(repositories.profile);
  const navigate = useNavigate();

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
        navigate(`/applications/${actions.create(details, source, stage)}`);
      }}
      onCancel={() => navigate('/')}
    />
  );

  return (
    <Routes>
      <Route element={<AppShell saveStatus={saveStatus} onRetrySave={onRetrySave} />}>
        <Route index element={<HomeView applications={applications} drafts={drafts} onDiscardDraft={removeDraft} />} />
        <Route path="applications" element={<ApplicationsView applications={applications} stages={stages} />} />
        <Route path="applications/new" element={wizard()} />
        <Route path="drafts/:id" element={<DraftRoute drafts={drafts} wizard={wizard} />} />
        <Route
          path="applications/:id"
          element={<ApplicationPage applications={applications} actions={actions} profile={profile} stages={stages} />}
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewTab />} />
          <Route path="cv" element={<Navigate to="personal" replace />} />
          <Route path="cv/:section" element={<CvTab />} />
          <Route path="cover-letter" element={<CoverLetterTab />} />
          <Route path="versions" element={<VersionsTab />} />
        </Route>
        <Route path="settings" element={<SettingsView />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfileSettings profile={profile} onChange={updateProfileField} />} />
          <Route
            path="stages"
            element={
              <StageSettings
                stages={stages}
                applications={applications}
                onAdd={addStage}
                onRemove={(stage) => removeStage(stage, applications)}
              />
            }
          />
        </Route>
      </Route>
      <Route path="applications/:id/preview/:doc" element={<PreviewPage applications={applications} profile={profile} />} />
      <Route
        path="applications/:id/versions/:versionId/preview/:doc"
        element={<PreviewPage applications={applications} profile={profile} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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

export default App;
