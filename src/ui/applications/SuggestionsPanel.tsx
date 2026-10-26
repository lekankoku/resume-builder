import React, { useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router';
import { AiClient } from '../../application/ports/repositories';
import { formatUsd } from '../../domain/application/cvGeneration';
import { JobApplication } from '../../domain/application/JobApplication';
import {
  applySuggestion,
  createSuggestionSet,
  setSuggestionStatus,
  SuggestionItem,
  SuggestionSection,
  suggestionBlocker,
} from '../../domain/application/suggestions';
import { RememberedAnswer } from '../../domain/candidate/CandidateFacts';
import { buttonClass, inputClass, labelClass, primaryButtonClass } from './ApplicationsView';

export type SuggestionScope = 'cv' | 'coverLetter';

interface Props {
  application: JobApplication;
  scope: SuggestionScope;
  ai: AiClient;
  jobBank: string;
  onUpdate: (change: (application: JobApplication) => JobApplication) => void;
  onRememberAnswers: (answers: RememberedAnswer[]) => void;
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

const SuggestionsPanel: React.FC<Props> = ({ application, scope, ai, jobBank, onUpdate, onRememberAnswers }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = application.suggestions ?? null;
  const blocker = suggestionBlocker(application.jobDescription, jobBank);
  const cv = { resume: application.resume, coverLetter: application.coverLetter };
  const pending = set?.items.filter((item) => item.status === 'pending' && inScope(scope)(item)) ?? [];
  const decided = set?.items.filter((item) => item.status !== 'pending' && inScope(scope)(item)) ?? [];
  const sections = pending.map((item) => item.section).filter((section, i, all) => all.indexOf(section) === i);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { title, currentRole, currentCompany } = application.resume.personal;
      const response = await ai.suggest({
        company: application.company,
        role: application.role,
        jobDescription: application.jobDescription ?? '',
        resume: { ...application.resume, personal: { title, currentRole, currentCompany } as typeof application.resume.personal },
        coverLetter: application.coverLetter,
      });
      const next = createSuggestionSet(response, new Date(), () => crypto.randomUUID());
      onUpdate((a) => ({ ...a, suggestions: next }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const decide = (item: SuggestionItem, status: 'accepted' | 'declined') =>
    onUpdate((a) => {
      if (!a.suggestions) return a;
      const next = status === 'accepted' ? applySuggestion({ resume: a.resume, coverLetter: a.coverLetter }, item) : null;
      if (status === 'accepted' && !next) return a;
      return { ...a, ...next, suggestions: setSuggestionStatus(a.suggestions, item.id, status) };
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
              <Link to="../overview" relative="path" className="font-semibold text-accent hover:underline">Open Overview</Link>
            )}
          </p>
        )}
        {error && <p role="alert" className="text-red-500 text-xs bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
      </div>

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
