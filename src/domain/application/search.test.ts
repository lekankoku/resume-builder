import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import { createCoverLetter } from '../coverLetter/CoverLetter';
import { ApplicationDraft } from './ApplicationDraft';
import { ApplicationDetails, createApplication } from './JobApplication';
import { createJobLead } from './JobLead';
import { searchRecords } from './search';

const uuid = () => crypto.randomUUID();

const someDetails = (overrides: Partial<ApplicationDetails> = {}): ApplicationDetails => ({
  company: uuid(),
  role: uuid(),
  postingUrl: `https://${uuid()}.com`,
  appliedOn: '',
  notes: uuid(),
  ...overrides,
});

const anApplication = (overrides: Partial<ApplicationDetails> = {}, stage = uuid()) =>
  createApplication(someDetails(overrides), { resume: aResume(), coverLetter: createCoverLetter(new Date()) }, stage, new Date(), uuid());

const aLead = (company: string = uuid()) => createJobLead({ company, role: uuid(), postingUrl: `https://${uuid()}.com` }, new Date(), uuid());

const aDraft = (overrides: Partial<ApplicationDetails> = {}): ApplicationDraft => ({
  id: uuid(),
  updatedAt: new Date().toISOString(),
  stepId: 'details',
  details: someDetails(overrides),
  cvStart: 'new',
  sourceId: '',
  jsonInput: '',
  cvKey: null,
  resume: aResume(),
  coverLetter: createCoverLetter(new Date()),
});

const nothing = { applications: [], leads: [], drafts: [] };

describe('searchRecords', () => {
  it('finds applications, saved jobs and drafts, ignoring case', () => {
    const company = uuid();
    const application = anApplication({ company });
    const lead = aLead(company);
    const draft = aDraft({ company });

    const results = searchRecords(company.toUpperCase(), { applications: [application, anApplication()], leads: [lead], drafts: [draft] }, 10);

    expect(results).toEqual([
      { kind: 'application', id: application.id, title: company, subtitle: `${application.role} · ${application.stage}` },
      { kind: 'lead', id: lead.id, title: company, subtitle: `${lead.role} · To apply` },
      { kind: 'draft', id: draft.id, title: company, subtitle: `${draft.details.role} · Draft` },
    ]);
  });

  it('matches an application by its notes, stage or posting URL', () => {
    const stage = uuid();
    const byNotes = anApplication();
    const byStage = anApplication({}, stage);
    const byUrl = anApplication();

    const found = (query: string) => searchRecords(query, { ...nothing, applications: [byNotes, byStage, byUrl] }, 10).map((r) => r.id);

    expect(found(byNotes.notes)).toEqual([byNotes.id]);
    expect(found(stage)).toEqual([byStage.id]);
    expect(found(byUrl.postingUrl)).toEqual([byUrl.id]);
  });

  it('requires every word of the query to match', () => {
    const company = uuid();
    const match = anApplication({ company });
    const sameCompanyOtherRole = anApplication({ company });

    const results = searchRecords(`${company}  ${match.role}`, { ...nothing, applications: [match, sameCompanyOtherRole] }, 10);

    expect(results.map((r) => r.id)).toEqual([match.id]);
  });

  it('returns nothing for a blank query', () => {
    expect(searchRecords('   ', { ...nothing, applications: [anApplication()] }, 10)).toEqual([]);
  });

  it('returns at most the given number of results', () => {
    const company = uuid();
    const applications = Array.from({ length: 3 }, () => anApplication({ company }));

    expect(searchRecords(company, { ...nothing, applications }, 2).map((r) => r.id)).toEqual([applications[0].id, applications[1].id]);
  });

  it('labels records without a company as untitled', () => {
    const lead = aLead('');

    expect(searchRecords(lead.role, { ...nothing, leads: [lead] }, 10)[0].title).toBe('Untitled company');
  });
});
