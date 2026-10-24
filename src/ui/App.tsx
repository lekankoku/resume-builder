import React, { lazy, startTransition, Suspense } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router';
import { Repositories, SaveStatusSource } from '../application/ports/repositories';
import { ApplicationDraft, draftStep, isWizardStep, WizardStep } from '../domain/application/ApplicationDraft';
import { initialStage } from '../domain/application/stages';
import ApplicationPage, { CompareTab, OverviewTab, VersionsTab } from './applications/ApplicationPage';
import ApplicationsView from './applications/ApplicationsView';
import CvsView from './applications/CvsView';
import HomeView from './applications/HomeView';
import NewApplicationWizard from './applications/NewApplicationWizard';
import { CoverLetterTab, CvTab } from './DocumentWorkspace';
import { useApplications } from './hooks/useApplications';
import { useDrafts } from './hooks/useDrafts';
import { useProfile } from './hooks/useProfile';
import { useStages } from './hooks/useStages';
import SettingsView, { ProfileSettings, StageSettings } from './settings/SettingsView';
import AppShell from './shell/AppShell';

const PreviewPage = lazy(() => import('./preview/PreviewPage'));

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

  const wizard = (stepId: WizardStep, draft?: ApplicationDraft) => (
    <NewApplicationWizard
      key={draft?.id ?? 'new'}
      applications={applications}
      stages={stages}
      profile={profile}
      draft={draft}
      stepId={stepId}
      onStepChange={(draftId, step) => navigate(`/drafts/${draftId}/${step}`, { replace: !draft })}
      onSaveDraft={saveDraft}
      onCreate={(details, source, draftId) => {
        const id = actions.create(details, source, initialStage(stages));
        startTransition(() => {
          navigate(`/applications/${id}`);
          if (draftId) removeDraft(draftId);
        });
      }}
      onCancel={() => navigate('/')}
    />
  );

  return (
    <Routes>
      <Route element={<AppShell saveStatus={saveStatus} onRetrySave={onRetrySave} />}>
        <Route index element={<HomeView applications={applications} stages={stages} drafts={drafts} onDiscardDraft={removeDraft} />} />
        <Route path="applications" element={<ApplicationsView applications={applications} stages={stages} onChangeStage={actions.changeStage} />} />
        <Route path="applications/new" element={wizard('details')} />
        <Route path="cvs" element={<CvsView applications={applications} />} />
        <Route path="drafts/:id" element={<DraftRoute drafts={drafts} wizard={wizard} />} />
        <Route path="drafts/:id/:step" element={<DraftRoute drafts={drafts} wizard={wizard} />} />
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
          <Route path="versions/:versionId/compare" element={<CompareTab />} />
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
      <Route path="applications/:id/preview/:doc" element={
          <Suspense fallback={null}>
            <PreviewPage applications={applications} profile={profile} />
          </Suspense>
        } />
      <Route
        path="applications/:id/versions/:versionId/preview/:doc"
        element={
          <Suspense fallback={null}>
            <PreviewPage applications={applications} profile={profile} />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const DraftRoute: React.FC<{
  drafts: ApplicationDraft[];
  wizard: (stepId: WizardStep, draft: ApplicationDraft) => React.ReactNode;
}> = ({ drafts, wizard }) => {
  const { id, step } = useParams();
  const draft = drafts.find((d) => d.id === id);
  if (!draft) return <Navigate to="/" replace />;
  if (!step || !isWizardStep(step)) return <Navigate to={`/drafts/${draft.id}/${draftStep(draft.stepId)}`} replace />;
  return wizard(step, draft);
};

export default App;
