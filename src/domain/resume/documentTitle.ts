import { PersonalInfo } from './Resume';

const companySuffix = (targetCompany: string) => (targetCompany ? ` (${targetCompany})` : '');

export const resumeDocumentTitle = ({ name, title }: PersonalInfo, targetCompany: string): string =>
  `${name} (${title})${companySuffix(targetCompany)}`;

export const coverLetterDocumentTitle = ({ name }: PersonalInfo, targetCompany: string): string =>
  `${name} - Cover Letter${companySuffix(targetCompany)}`;
