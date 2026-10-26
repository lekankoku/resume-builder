import { describe, expect, it } from 'vitest';
import { addFact, CandidateFacts, createCandidateFacts, rememberAnswers, removeFact, updateFact, withFactsDefaults } from './CandidateFacts';

const uuid = () => crypto.randomUUID();

const someFacts = (): CandidateFacts => ({
  ...createCandidateFacts(),
  languages: [
    { name: uuid(), level: uuid(), basis: 'certificate' },
    { name: uuid(), level: uuid(), basis: 'mother tongue' },
  ],
  answers: [{ question: uuid(), answer: uuid() }],
});

describe('CandidateFacts', () => {
  describe('withFactsDefaults', () => {
    it('fills every missing field and keeps the stored ones', () => {
      const languages = someFacts().languages;

      expect(withFactsDefaults({ languages })).toEqual({ ...createCandidateFacts(), languages });
    });
  });

  describe('addFact', () => {
    it.each([
      ['languages', { name: '', level: '', basis: '' }],
      ['references', { name: '', role: '', company: '', contact: '', linkedin: '', consented: false, isCurrentManager: false }],
      ['education', { institution: '', location: '', degree: '', period: '', completed: true, details: '' }],
    ] as const)('appends an empty %s entry', (list, template) => {
      const facts = someFacts();

      const updated = addFact(facts, list);

      expect(updated[list]).toEqual([...facts[list], template]);
    });
  });

  describe('updateFact', () => {
    it('changes one field of one entry without mutating the original', () => {
      const facts = someFacts();
      const original = structuredClone(facts);
      const level = uuid();

      const updated = updateFact(facts, 'languages', 1, 'level', level);

      expect(updated.languages).toEqual([facts.languages[0], { ...facts.languages[1], level }]);
      expect(facts).toEqual(original);
    });
  });

  describe('removeFact', () => {
    it('removes the entry at the index', () => {
      const facts = someFacts();

      expect(removeFact(facts, 'languages', 0).languages).toEqual([facts.languages[1]]);
    });
  });

  describe('rememberAnswers', () => {
    it('adds new answers and replaces the answer to a question asked before', () => {
      const facts = someFacts();
      const replaced = { question: facts.answers[0].question, answer: uuid() };
      const added = { question: uuid(), answer: uuid() };

      expect(rememberAnswers(facts, [replaced, added]).answers).toEqual([replaced, added]);
    });
  });
});
