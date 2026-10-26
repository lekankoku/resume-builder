import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import { createCoverLetter } from '../coverLetter/CoverLetter';
import {
  applySuggestion,
  createSuggestionSet,
  Cv,
  setSuggestionStatus,
  Suggestion,
  suggestionBlocker,
  SuggestionsResponse,
} from './suggestions';

const uuid = () => crypto.randomUUID();

const aCv = (): Cv => ({
  resume: aResume(),
  coverLetter: { ...createCoverLetter(new Date()), subject: uuid(), body: `${uuid()}\n\n${uuid()}\n\n${uuid()}` },
});

const aSuggestion = (overrides: Partial<Suggestion>): Suggestion => ({
  action: 'replace',
  section: 'experiences',
  item: '',
  field: '',
  before: '',
  after: '',
  newItem: { fields: [], bullets: [] },
  reason: uuid(),
  source: '',
  ...overrides,
});

const paragraphs = (cv: Cv) => cv.coverLetter.body.split('\n\n');

describe('suggestions', () => {
  describe('applySuggestion', () => {
    describe('bullets of an entry', () => {
      it('replaces the bullet with the same text in the entry with the same identifying text', () => {
        const cv = aCv();
        const experience = cv.resume.experiences[0];
        const after = uuid();

        const result = applySuggestion(cv, aSuggestion({ item: experience.company, field: 'bullets', before: experience.bullets[1], after }));

        expect(result!.resume.experiences[0].bullets).toEqual([experience.bullets[0], after]);
        expect(cv.resume.experiences[0].bullets).toEqual(experience.bullets);
      });

      it('adds a bullet after the given bullet, or at the end without one', () => {
        const cv = aCv();
        const { company, bullets } = cv.resume.experiences[0];
        const [first, last] = [uuid(), uuid()];

        const afterFirst = applySuggestion(cv, aSuggestion({ action: 'add', item: company, field: 'bullets', before: bullets[0], after: first }));
        const atEnd = applySuggestion(cv, aSuggestion({ action: 'add', item: company, field: 'bullets', after: last }));

        expect(afterFirst!.resume.experiences[0].bullets).toEqual([bullets[0], first, bullets[1]]);
        expect(atEnd!.resume.experiences[0].bullets).toEqual([...bullets, last]);
      });

      it('removes the bullet', () => {
        const cv = aCv();
        const { company, bullets } = cv.resume.experiences[0];

        const result = applySuggestion(cv, aSuggestion({ action: 'remove', item: company, field: 'bullets', before: bullets[0] }));

        expect(result!.resume.experiences[0].bullets).toEqual([bullets[1]]);
      });

      it('matches text regardless of surrounding whitespace', () => {
        const cv = aCv();
        const { company, bullets } = cv.resume.experiences[0];

        const result = applySuggestion(cv, aSuggestion({ action: 'remove', item: ` ${company} `, field: 'bullets', before: `${bullets[0]}\n` }));

        expect(result!.resume.experiences[0].bullets).toEqual([bullets[1]]);
      });
    });

    describe('fields and whole entries', () => {
      it('replaces a field of an entry', () => {
        const cv = aCv();
        const project = cv.resume.projects[0];
        const after = uuid();

        const result = applySuggestion(cv, aSuggestion({ section: 'projects', item: project.title, field: 'scope', before: project.scope, after }));

        expect(result!.resume.projects[0]).toEqual({ ...project, scope: after });
      });

      it('adds a whole entry from the template with the given fields and bullets, ignoring unknown fields', () => {
        const cv = aCv();
        const [company, role, bullet] = [uuid(), uuid(), uuid()];

        const result = applySuggestion(
          cv,
          aSuggestion({
            action: 'add',
            newItem: {
              fields: [
                { name: 'company', value: company },
                { name: 'role', value: role },
                { name: 'unknown', value: uuid() },
              ],
              bullets: [bullet],
            },
          }),
        );

        expect(result!.resume.experiences.at(-1)).toEqual({
          company,
          role,
          location: '',
          period: '',
          earlierPositions: [],
          bullets: [bullet],
        });
      });

      it('adds an entry without bullets for a section that has none', () => {
        const cv = aCv();
        const name = uuid();

        const result = applySuggestion(
          cv,
          aSuggestion({ action: 'add', section: 'languages', newItem: { fields: [{ name: 'name', value: name }, { name: 'level', value: 'C1' }], bullets: [uuid()] } }),
        );

        expect(result!.resume.languages.at(-1)).toEqual({ name, level: 'C1' });
      });

      it('removes a whole entry', () => {
        const cv = aCv();
        const [kept, removed] = [cv.resume.experiences[0], cv.resume.experiences[1]];

        const result = applySuggestion(cv, aSuggestion({ action: 'remove', item: removed.company }));

        expect(result!.resume.experiences).toEqual([kept, cv.resume.experiences[2]]);
      });
    });

    describe('personal and leadership', () => {
      it('replaces the tagline', () => {
        const cv = aCv();
        const after = uuid();

        const result = applySuggestion(cv, aSuggestion({ section: 'personal', field: 'title', before: cv.resume.personal.title, after }));

        expect(result!.resume.personal).toEqual({ ...cv.resume.personal, title: after });
      });

      it('does not touch other personal fields', () => {
        const cv = aCv();

        expect(applySuggestion(cv, aSuggestion({ section: 'personal', field: 'email', before: cv.resume.personal.email, after: uuid() }))).toBeNull();
      });

      it('replaces the leadership title and adds a leadership bullet', () => {
        const cv = aCv();
        const [title, bullet] = [uuid(), uuid()];

        const renamed = applySuggestion(cv, aSuggestion({ section: 'leadership', field: 'title', before: cv.resume.crossFunctional.title, after: title }));
        const added = applySuggestion(cv, aSuggestion({ action: 'add', section: 'leadership', field: 'bullets', after: bullet }));

        expect(renamed!.resume.crossFunctional.title).toBe(title);
        expect(added!.resume.crossFunctional.bullets).toEqual([...cv.resume.crossFunctional.bullets, bullet]);
      });
    });

    describe('cover letter', () => {
      it('replaces, adds after and removes body paragraphs', () => {
        const cv = aCv();
        const [first, second, third] = paragraphs(cv);
        const [replacement, addition] = [uuid(), uuid()];

        const replaced = applySuggestion(cv, aSuggestion({ section: 'coverLetter', field: 'body', before: second, after: replacement }));
        const added = applySuggestion(cv, aSuggestion({ action: 'add', section: 'coverLetter', field: 'body', before: first, after: addition }));
        const removed = applySuggestion(cv, aSuggestion({ action: 'remove', section: 'coverLetter', field: 'body', before: third }));

        expect(paragraphs(replaced!)).toEqual([first, replacement, third]);
        expect(paragraphs(added!)).toEqual([first, addition, second, third]);
        expect(paragraphs(removed!)).toEqual([first, second]);
      });

      it('writes the first paragraph of an empty letter', () => {
        const cv = { ...aCv(), coverLetter: createCoverLetter(new Date()) };
        const greeting = uuid();

        const result = applySuggestion(cv, aSuggestion({ action: 'add', section: 'coverLetter', field: 'body', after: greeting }));

        expect(result!.coverLetter.body).toBe(greeting);
      });

      it('fills an empty subject', () => {
        const cv = { ...aCv(), coverLetter: createCoverLetter(new Date()) };
        const subject = uuid();

        const result = applySuggestion(cv, aSuggestion({ action: 'add', section: 'coverLetter', field: 'subject', after: subject }));

        expect(result!.coverLetter.subject).toBe(subject);
      });
    });

    describe('when the CV no longer matches', () => {
      it.each([
        ['an unknown entry', { item: uuid(), field: 'bullets', before: uuid(), after: uuid() }],
        ['a bullet that is gone', { field: 'bullets', before: uuid(), after: uuid() }],
        ['a field that changed', { field: 'role', before: uuid(), after: uuid() }],
        ['a field that does not exist', { field: uuid(), before: '', after: uuid() }],
        ['a paragraph that is gone', { section: 'coverLetter' as const, field: 'body', before: uuid(), after: uuid() }],
        ['a tagline that changed', { section: 'personal' as const, field: 'title', before: uuid(), after: uuid() }],
      ])('returns null for %s', (_, overrides) => {
        const cv = aCv();

        expect(applySuggestion(cv, aSuggestion({ item: cv.resume.experiences[0].company, ...overrides }))).toBeNull();
      });

      it('keeps later suggestions applicable after an earlier one is accepted', () => {
        const cv = aCv();
        const { company, bullets } = cv.resume.experiences[0];
        const removeFirst = aSuggestion({ action: 'remove', item: company, field: 'bullets', before: bullets[0] });
        const replaceSecond = aSuggestion({ item: company, field: 'bullets', before: bullets[1], after: uuid() });

        const result = applySuggestion(applySuggestion(cv, removeFirst)!, replaceSecond);

        expect(result!.resume.experiences[0].bullets).toEqual([replaceSecond.after]);
      });
    });
  });

  describe('createSuggestionSet and setSuggestionStatus', () => {
    it('stores every suggestion as pending with its own id and then records decisions', () => {
      const response: SuggestionsResponse = {
        summary: uuid(),
        gaps: [uuid()],
        questions: [uuid()],
        suggestions: [aSuggestion({}), aSuggestion({})],
        usage: { inputTokens: 1, cachedInputTokens: 0, outputTokens: 1, costUsd: 0.01 },
      };
      const ids = [uuid(), uuid()];
      const now = new Date();

      const set = createSuggestionSet(response, now, () => ids.shift()!);
      const decided = setSuggestionStatus(set, set.items[1].id, 'declined');

      expect(set).toEqual({
        createdAt: now.toISOString(),
        summary: response.summary,
        gaps: response.gaps,
        questions: response.questions,
        usage: response.usage,
        items: response.suggestions.map((s, i) => ({ ...s, id: set.items[i].id, status: 'pending' })),
      });
      expect(decided.items.map((item) => item.status)).toEqual(['pending', 'declined']);
    });
  });

  describe('suggestionBlocker', () => {
    it('allows suggestions with a job bank and a job description', () => {
      expect(suggestionBlocker(uuid(), uuid())).toBeNull();
    });

    it('asks for the job bank first', () => {
      expect(suggestionBlocker(uuid(), ' ')).toBe('Add your job bank in Settings first.');
    });

    it.each([undefined, '', '  '])('asks for the job description when it is %j', (jobDescription) => {
      expect(suggestionBlocker(jobDescription, uuid())).toBe('Add the job description in Overview first.');
    });
  });
});
