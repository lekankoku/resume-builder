import React, { lazy, startTransition, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { AiClient, DocumentClient, Repositories, SaveStatusSource } from '../application/ports/repositories';
import { ApplicationDraft, draftStep, isWizardStep, WizardStep } from '../domain/application/ApplicationDraft';
import { JobLead } from '../domain/application/JobLead';
import { initialStage } from '../domain/application/stages';
import { rememberAnswers } from '../domain/candidate/CandidateFacts';
import ApplicationPage, { CompareTab, OverviewTab, VersionsTab } from './applications/ApplicationPage';
import ApplicationsView from './applications/ApplicationsView';
import CvsView from './applications/CvsView';
import HomeView from './applications/HomeView';
import LeadsView from './applications/LeadsView';
import NewApplicationWizard from './applications/NewApplicationWizard';
import { CoverLetterTab, CvTab } from './DocumentWorkspace';
import DocumentsView from './documents/DocumentsView';
import { useApplications } from './hooks/useApplications';
import { useCandidateFacts } from './hooks/useCandidateFacts';
import { useCvGuide } from './hooks/useCvGuide';
import { useDrafts } from './hooks/useDrafts';
import { useJobBank } from './hooks/useJobBank';
import { useLeads } from './hooks/useLeads';
import { useProfile } from './hooks/useProfile';
import { useStages } from './hooks/useStages';
import SettingsView, {
  AiUsageSettings,
  CvFactsSettings,
  CvGuideSettings,
  JobBankSettings,
  ProfileSettings,
  StageSettings,
  WorkAuthorizationSettings,
} from './settings/SettingsView';
import AppShell from './shell/AppShell';

const PreviewPage = lazy(() => import('./preview/PreviewPage'));

interface AppProps {
  repositories: Repositories;
  documents: DocumentClient;
  ai: AiClient;
  saveStatus: SaveStatusSource;
  onRetrySave: () => void;
}

const App: React.FC<AppProps> = ({ repositories, documents, ai, saveStatus, onRetrySave }) => {
  const { applications, actions } = useApplications(repositories.applications);
  const { stages, add: addStage, remove: removeStage } = useStages(repositories.stages);
  const { drafts, save: saveDraft, remove: removeDraft } = useDrafts(repositories.drafts);
  const { leads, add: addLead, remove: removeLead, removeForPosting } = useLeads(repositories.leads);
  const { profile, updateField: updateProfileField } = useProfile(repositories.profile);
  const { jobBank, setJobBank } = useJobBank(repositories.jobBank);
  const { facts, setFacts } = useCandidateFacts(repositories.facts);
  const { cvGuide, setCvGuide } = useCvGuide(repositories.cvGuide);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' && window.matchMedia('(max-width: 767px)').matches) navigate('/to-apply', { replace: true });
  }, []);

  const wizard = (stepId: WizardStep, draft?: ApplicationDraft, lead?: JobLead) => (
    <NewApplicationWizard
      key={draft?.id ?? lead?.id ?? 'new'}
      applications={applications}
      stages={stages}
      profile={profile}
      jobBank={jobBank}
      ai={ai}
      draft={draft}
      initialDetails={lead && { postingUrl: lead.postingUrl, company: lead.company, role: lead.role }}
      stepId={stepId}
      onStepChange={(draftId, step) => navigate(`/drafts/${draftId}/${step}`, { replace: !draft })}
      onSaveDraft={saveDraft}
      onRememberAnswers={(answers) => setFacts((current) => rememberAnswers(current, answers))}
      onCreate={(details, source, draftId) => {
        const id = actions.create(details, source, initialStage(stages));
        startTransition(() => {
          navigate(`/applications/${id}`);
          if (draftId) removeDraft(draftId);
          removeForPosting(details.postingUrl);
        });
      }}
      onCancel={() => navigate('/')}
    />
  );

  return (
    <Routes>
      <Route element={<AppShell saveStatus={saveStatus} onRetrySave={onRetrySave} records={{ applications, leads, drafts }} />}>
        <Route index element={<HomeView applications={applications} stages={stages} drafts={drafts} leads={leads} onDiscardDraft={removeDraft} />} />
        <Route path="applications" element={<ApplicationsView applications={applications} stages={stages} onChangeStage={actions.changeStage} />} />
        <Route path="applications/new" element={<NewApplicationRoute leads={leads} wizard={wizard} />} />
        <Route path="to-apply" element={<LeadsView leads={leads} onAdd={addLead} onRemove={removeLead} />} />
        <Route path="cvs" element={<CvsView applications={applications} />} />
        <Route path="documents" element={<DocumentsView client={documents} />} />
        <Route path="drafts/:id" element={<DraftRoute drafts={drafts} wizard={wizard} />} />
        <Route path="drafts/:id/:step" element={<DraftRoute drafts={drafts} wizard={wizard} />} />
        <Route
          path="applications/:id"
          element={
            <ApplicationPage
              applications={applications}
              actions={actions}
              profile={profile}
              stages={stages}
              ai={ai}
              jobBank={jobBank}
              onRememberAnswers={(answers) => setFacts((current) => rememberAnswers(current, answers))}
            />
          }
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
          <Route
            path="profile"
            element={
              <>
                <ProfileSettings profile={profile} onChange={updateProfileField} />
                <WorkAuthorizationSettings facts={facts} onChange={setFacts} />
              </>
            }
          />
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
          <Route path="job-bank" element={<JobBankSettings jobBank={jobBank} onChange={setJobBank} />} />
          <Route path="cv-facts" element={<CvFactsSettings facts={facts} onChange={setFacts} />} />
          <Route path="cv-guide" element={<CvGuideSettings cvGuide={cvGuide} documents={documents} onChange={setCvGuide} />} />
          <Route path="ai-usage" element={<AiUsageSettings client={ai} />} />
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

const NewApplicationRoute: React.FC<{
  leads: JobLead[];
  wizard: (stepId: WizardStep, draft?: ApplicationDraft, lead?: JobLead) => React.ReactNode;
}> = ({ leads, wizard }) => {
  const [params] = useSearchParams();
  const lead = leads.find((l) => l.id === params.get('lead'));
  return wizard('details', undefined, lead);
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
