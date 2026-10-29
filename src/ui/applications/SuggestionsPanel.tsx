import React, { useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router';
import { AiClient } from '../../application/ports/repositories';
import { formatUsd } from '../../domain/application/cvGeneration';
import {
  acceptSuggestion,
  applySuggestion,
  createSuggestionSet,
  setSuggestionStatus,
  SuggestionItem,
  SuggestionSection,
  SuggestionSet,
  suggestionBlocker,
} from '../../domain/application/suggestions';
import { RememberedAnswer } from '../../domain/candidate/CandidateFacts';
import { CoverLetter } from '../../domain/coverLetter/CoverLetter';
import { Resume } from '../../domain/resume/Resume';
import { Loading, Skeleton } from '../shell/Skeleton';
import { buttonClass, inputClass, labelClass, primaryButtonClass } from './ApplicationsView';

export type SuggestionScope = 'cv' | 'coverLetter';

export interface SuggestionState {
  resume: Resume;
  coverLetter: CoverLetter;
  suggestions: SuggestionSet | null;
}

export interface SuggestionContext {
  job: { company: string; role: string; jobDescription?: string };
  state: SuggestionState;
  ai: AiClient;
  jobBank: string;
  jobDescriptionAt: { label: string; to: string };
  onUpdate: (change: (state: SuggestionState) => SuggestionState) => void;
  onRememberAnswers: (answers: RememberedAnswer[]) => void;
}

interface Props extends SuggestionContext {
  scope: SuggestionScope;
}

const SECTION_LABELS: Record<SuggestionSection, string> = {
  personal: 'Title and current position',
  experiences: 'Experience',
  projects: 'Projects',
  volunteering: 'Volunteering',
  abilities: 'Job related abilities',
  leadership: 'Leadership',
  technicalProficiency: 'Tech Stack',
  education: 'Education',
  languages: 'Languages',
  references: 'References',
  coverLetter: 'Cover letter',
};

const ACTION_LABELS: Record<SuggestionItem['action'], string> = { add: 'Add', remove: 'Remove', replace: 'Refine' };

const inScope = (scope: SuggestionScope) => (item: SuggestionItem) => (scope === 'coverLetter') === (item.section === 'coverLetter');

export const pendingCount = (suggestions: SuggestionSet | null, scope: SuggestionScope): number =>
  suggestions?.items.filter((item) => item.status === 'pending' && inScope(scope)(item)).length ?? 0;

export const PreviewWithSuggestions: React.FC<SuggestionContext & { scope: SuggestionScope; preview: React.ReactNode }> = ({
  preview,
  ...panel
}) => {
  const [view, setView] = useState<'preview' | 'suggestions'>('preview');
  const pending = pendingCount(panel.state.suggestions, panel.scope);
  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm ${active ? 'bg-accent text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button aria-pressed={view === 'preview'} onClick={() => setView('preview')} className={tabClass(view === 'preview')}>
          Preview
        </button>
        <button aria-pressed={view === 'suggestions'} onClick={() => setView('suggestions')} className={tabClass(view === 'suggestions')}>
          AI suggestions{pending > 0 ? ` (${pending})` : ''}
        </button>
      </div>
      {view === 'preview' ? preview : <SuggestionsPanel {...panel} />}
    </div>
  );
};

const SuggestionsPanel: React.FC<Props> = ({ job, state, scope, ai, jobBank, jobDescriptionAt, onUpdate, onRememberAnswers }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = state.suggestions;
  const blocker = suggestionBlocker(job.jobDescription, jobBank, jobDescriptionAt.label);
  const cv = { resume: state.resume, coverLetter: state.coverLetter };
  const pending = set?.items.filter((item) => item.status === 'pending' && inScope(scope)(item)) ?? [];
  const decided = set?.items.filter((item) => item.status !== 'pending' && inScope(scope)(item)) ?? [];
  const sections = pending.map((item) => item.section).filter((section, i, all) => all.indexOf(section) === i);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { title, currentRole, currentCompany } = state.resume.personal;
      const response = await ai.suggest({
        company: job.company,
        role: job.role,
        jobDescription: job.jobDescription ?? '',
        resume: { ...state.resume, personal: { title, currentRole, currentCompany } as Resume['personal'] },
        coverLetter: state.coverLetter,
      });
      const next = createSuggestionSet(response, new Date(), () => crypto.randomUUID());
      onUpdate((current) => ({ ...current, suggestions: next }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const decide = (item: SuggestionItem, status: 'accepted' | 'declined') =>
    onUpdate((current) => {
      if (!current.suggestions) return current;
      if (status === 'declined') return { ...current, suggestions: setSuggestionStatus(current.suggestions, item.id, status) };
      const accepted = acceptSuggestion({ resume: current.resume, coverLetter: current.coverLetter }, current.suggestions, item.id);
      return accepted ? { ...accepted.cv, suggestions: accepted.set } : current;
    });

  return (
    <section aria-label="AI suggestions" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-800">
      <div className="space-y-2">
        <p className="text-slate-500">
          Suggestions compare this {scope === 'cv' ? 'CV' : 'cover letter'} with the job description, your job bank and your CV facts.
          Nothing changes until you accept a suggestion.
        </p>
        <button onClick={fetchSuggestions} disabled={loading || !!blocker} className={`${set ? buttonClass : primaryButtonClass} disabled:opacity-40`}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? 'Reviewing… this can take a minute' : set ? 'Refresh suggestions' : 'Get suggestions'}
        </button>
        {blocker && (
          <p className="text-xs text-slate-500">
            {blocker}{' '}
            {!jobBank.trim() ? (
              <Link to="/settings/job-bank" className="font-semibold text-accent hover:underline">Open job bank settings</Link>
            ) : (
              <Link to={jobDescriptionAt.to} relative="path" className="font-semibold text-accent hover:underline">
                Open {jobDescriptionAt.label}
              </Link>
            )}
          </p>
        )}
        {error && <p role="alert" className="text-red-500 text-xs bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
      </div>

      {loading && !set && (
        <Loading label="Loading suggestions" className="space-y-3">
          {[0, 1, 2].map((card) => (
            <div key={card} className="rounded-xl border border-slate-200 p-4 space-y-2">
              <Skeleton className="h-3.5 w-1/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </Loading>
      )}

      {set && (
        <>
          <p className="text-xs text-slate-500">
            Suggested {new Date(set.createdAt).toLocaleString()} · estimated cost {formatUsd(set.usage.costUsd)}
            {decided.length > 0 && ` · ${decided.filter((d) => d.status === 'accepted').length} accepted, ${decided.filter((d) => d.status === 'declined').length} declined`}
          </p>
          {set.summary && <p>{set.summary}</p>}
          {set.gaps.length > 0 && (
            <div>
              <h3 className={labelClass}>Gaps — the job asks for these, but nothing in your data supports them</h3>
              <ul className="list-disc pl-5 space-y-1">
                {set.gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
          {set.questions.length > 0 && <Questions questions={set.questions} onSave={onRememberAnswers} />}

          {pending.length === 0 ? (
            <p className="text-slate-500">No open suggestions for this {scope === 'cv' ? 'CV' : 'cover letter'}.</p>
          ) : (
            sections.map((section) => (
              <div key={section} className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">{SECTION_LABELS[section]}</h3>
                {pending
                  .filter((item) => item.section === section)
                  .map((item) => (
                    <SuggestionCard key={item.id} item={item} applicable={!!applySuggestion(cv, item)} onDecide={(status) => decide(item, status)} />
                  ))}
              </div>
            ))
          )}
        </>
      )}
    </section>
  );
};

const SuggestionCard: React.FC<{
  item: SuggestionItem;
  applicable: boolean;
  onDecide: (status: 'accepted' | 'declined') => void;
}> = ({ item, applicable, onDecide }) => {
  const target = [item.item, item.field && item.field !== 'bullets' && item.field !== 'body' ? item.field : ''].filter(Boolean).join(' · ');
  const newEntry = !item.field && item.action === 'add';
  return (
    <article aria-label={`${ACTION_LABELS[item.action]}: ${item.reason}`} className="rounded-xl border border-slate-200 p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">
        {ACTION_LABELS[item.action]}
        {target && <span className="ml-2 normal-case font-normal text-slate-500">{target}</span>}
      </p>
      {item.action !== 'add' && item.before && <p className="text-slate-500 line-through">{item.before}</p>}
      {item.action === 'remove' && !item.field && <p className="text-slate-500 line-through">{item.item}</p>}
      {item.after && <p className="text-slate-900">{item.after}</p>}
      {newEntry && (
        <div className="text-slate-900">
          <p className="font-semibold">{item.newItem.fields.map((f) => f.value).filter(Boolean).join(' · ')}</p>
          <ul className="list-disc pl-5">
            {item.newItem.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-slate-500">{item.reason}</p>
      {item.source && <p className="text-xs text-slate-500">From your data: “{item.source}”</p>}
      {!applicable && <p className="text-xs text-amber-700">Your CV changed since this suggestion, so it can't be applied.</p>}
      <div className="flex gap-2">
        <button onClick={() => onDecide('accepted')} disabled={!applicable} className={`${primaryButtonClass} disabled:opacity-40`}>
          <Check size={14} /> Accept
        </button>
        <button onClick={() => onDecide('declined')} className={buttonClass}>
          <X size={14} /> Decline
        </button>
      </div>
    </article>
  );
};

const Questions: React.FC<{ questions: string[]; onSave: (answers: RememberedAnswer[]) => void }> = ({ questions, onSave }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string[]>([]);

  return (
    <div className="space-y-3">
      <h3 className={labelClass}>Questions — answer to get better suggestions next time</h3>
      {questions.map((question) => (
        <div key={question} className="space-y-1">
          <label className="block space-y-1">
            <span className="block">{question}</span>
            <textarea
              className={inputClass}
              rows={2}
              value={answers[question] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [question]: e.target.value }))}
            />
          </label>
          {saved.includes(question) ? (
            <p className="text-xs text-emerald-700">Saved to CV facts. Refresh suggestions to use it.</p>
          ) : (
            <button
              aria-label={`Save the answer to "${question}" to CV facts`}
              disabled={!answers[question]?.trim()}
              onClick={() => {
                onSave([{ question, answer: answers[question].trim() }]);
                setSaved((s) => [...s, question]);
              }}
              className={`${buttonClass} disabled:opacity-40`}
            >
              Save to CV facts
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default SuggestionsPanel;
