import { describe, expect, it } from 'vitest';
import { createJobLead, removeLeadsForPosting } from './JobLead';

const uuid = () => crypto.randomUUID();

const aLead = (postingUrl = `https://${uuid()}.com`) => createJobLead({ postingUrl, company: uuid(), role: uuid() }, new Date(), uuid());

describe('JobLead', () => {
  describe('createJobLead', () => {
    it('trims the details and records when the lead was added', () => {
      const [url, company, role, id] = [`https://${uuid()}.com`, uuid(), uuid(), uuid()];
      const now = new Date();

      const lead = createJobLead({ postingUrl: ` ${url} `, company: ` ${company} `, role: ` ${role} ` }, now, id);

      expect(lead).toEqual({ id, addedAt: now.toISOString(), postingUrl: url, company, role });
    });
  });

  describe('removeLeadsForPosting', () => {
    it('removes the leads for the given posting and keeps the rest', () => {
      const applied = aLead();
      const other = aLead();

      expect(removeLeadsForPosting([applied, other], ` ${applied.postingUrl} `)).toEqual([other]);
    });
  });
});
