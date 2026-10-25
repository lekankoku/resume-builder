import React from 'react';
import { Eye, FileText } from 'lucide-react';
import { Link } from 'react-router';
import { JobApplication } from '../../domain/application/JobApplication';
import { newestAppliedFirst } from '../../domain/application/pipeline';
import PageHeader from '../shell/PageHeader';
import { buttonClass, primaryButtonClass } from './ApplicationsView';

interface Props {
  applications: JobApplication[];
}

const CvsView: React.FC<Props> = ({ applications }) => (
  <div className="max-w-6xl">
    <PageHeader title="CVs" subtitle={`${applications.length} CVs from your applications`} />

    {applications.length === 0 ? (
      <p className="text-sm text-slate-500">No CVs yet.</p>
    ) : (
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {newestAppliedFirst(applications).map((application) => {
          const company = application.company || 'Untitled company';
          return (
            <li key={application.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
              <div className="space-y-1">
                <Link to={`/applications/${application.id}`} className="text-base font-semibold text-slate-900 hover:underline">
                  {company}
                </Link>
                <p className="text-sm text-slate-600">{application.role}</p>
                <p className="text-sm text-slate-900">{application.resume.personal.title || 'Untitled CV'}</p>
                <p className="text-xs text-slate-400">
                  Applied {application.appliedOn || '—'} · {application.stage} · {application.versions.length} saved versions
                </p>
              </div>
              <div className="mt-auto flex gap-2">
                <Link
                  to={`/applications/${application.id}/preview/resume`}
                  aria-label={`Preview CV for ${company}`}
                  className={primaryButtonClass}
                >
                  <Eye size={14} /> Preview CV
                </Link>
                <Link
                  to={`/applications/${application.id}/preview/cover-letter`}
                  aria-label={`Preview cover letter for ${company}`}
                  className={buttonClass}
                >
                  <FileText size={14} /> Cover letter
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default CvsView;
