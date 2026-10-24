import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { JobApplication } from '../../domain/application/JobApplication';
import { Profile } from '../../domain/resume/Resume';
import { applyProfile } from '../../domain/resume/resumeOperations';
import CoverLetterPreview from './CoverLetterPreview';
import ResumePreview, { PrintVariant } from './ResumePreview';

interface Props {
  applications: JobApplication[];
  profile: Profile;
}

const PreviewPage: React.FC<Props> = ({ applications, profile }) => {
  const { id, versionId, doc } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [printVariant, setPrintVariant] = useState<PrintVariant>('continuous');

  const application = applications.find((a) => a.id === id);
  const version = versionId ? application?.versions.find((v) => v.id === versionId) : undefined;
  if (!application || (versionId && !version) || (doc !== 'resume' && doc !== 'cover-letter')) {
    return <Navigate to="/applications" replace />;
  }

  const source = version ?? application;
  const resume = applyProfile(source.resume, profile);
  const back = () =>
    location.key === 'default'
      ? navigate(`/applications/${application.id}/${versionId ? 'versions' : 'cv'}`)
      : navigate(-1);
  const show = (target: 'resume' | 'cover-letter') => navigate(`../${target}`, { relative: 'path', replace: true });

  return doc === 'resume' ? (
    <ResumePreview
      resume={resume}
      targetCompany={application.company}
      printVariant={printVariant}
      onPrintVariantChange={setPrintVariant}
      onBackToEditor={back}
      onShowCoverLetter={() => show('cover-letter')}
    />
  ) : (
    <CoverLetterPreview
      resume={resume}
      coverLetter={source.coverLetter}
      targetCompany={application.company}
      onBackToEditor={back}
      onShowResume={() => show('resume')}
    />
  );
};

export default PreviewPage;
