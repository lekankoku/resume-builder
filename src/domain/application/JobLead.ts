import { ApplicationDetails } from './JobApplication';

export type LeadDetails = Pick<ApplicationDetails, 'postingUrl' | 'company' | 'role'>;

export interface JobLead extends LeadDetails {
  id: string;
  addedAt: string;
}

export const createJobLead = (details: LeadDetails, now: Date, id: string): JobLead => ({
  id,
  addedAt: now.toISOString(),
  postingUrl: details.postingUrl.trim(),
  company: details.company.trim(),
  role: details.role.trim(),
});

export const removeLeadsForPosting = (leads: JobLead[], postingUrl: string): JobLead[] =>
  leads.filter((lead) => lead.postingUrl !== postingUrl.trim());
