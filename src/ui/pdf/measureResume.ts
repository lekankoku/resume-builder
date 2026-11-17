import { createElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import { CvFit, fitToBudget } from '../../domain/resume/cvLength';
import { Resume } from '../../domain/resume/Resume';
import './browserFonts';
import { pageCountOf } from './pageCount';
import ResumePdf from './ResumePdf';

export const measureResume = (resume: Resume, targetCompany: string): Promise<CvFit> =>
  fitToBudget(async (density) => {
    const blob = await pdf(createElement(ResumePdf, { resume, targetCompany, density })).toBlob();
    return pageCountOf(new Uint8Array(await blob.arrayBuffer()));
  });
