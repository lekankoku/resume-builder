import { useEffect, useState } from 'react';
import { LeadRepository } from '../../application/ports/repositories';
import { createJobLead, JobLead, LeadDetails, removeLeadsForPosting } from '../../domain/application/JobLead';

export const useLeads = (repository: LeadRepository) => {
  const [leads, setLeads] = useState<JobLead[]>(() => repository.load());

  useEffect(() => {
    repository.save(leads);
  }, [repository, leads]);

  const add = (details: LeadDetails) => setLeads((current) => [...current, createJobLead(details, new Date(), crypto.randomUUID())]);
  const remove = (id: string) => setLeads((current) => current.filter((lead) => lead.id !== id));
  const removeForPosting = (postingUrl: string) => setLeads((current) => removeLeadsForPosting(current, postingUrl));

  return { leads, add, remove, removeForPosting, restore: setLeads };
};
