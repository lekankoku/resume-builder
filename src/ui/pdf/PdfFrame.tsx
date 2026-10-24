import React, { useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';
import PrintToolbar from '../preview/PrintToolbar';
import { registerPdfFonts } from './fonts';

registerPdfFonts((file) => `/fonts/${file}`);

interface Props {
  document: React.ReactElement;
  fileName: string;
  active: 'resume' | 'cover-letter';
  onBack: () => void;
  onShowResume: () => void;
  onShowCoverLetter: () => void;
}

const PdfFrame: React.FC<Props> = ({ document, fileName, active, onBack, onShowResume, onShowCoverLetter }) => {
  const [pdf, update] = usePDF({ document });
  useEffect(() => update(document), [document, update]);

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <PrintToolbar
        active={active}
        onBack={onBack}
        onShowResume={onShowResume}
        onShowCoverLetter={onShowCoverLetter}
        downloadUrl={pdf.url}
        fileName={fileName}
      />
      {pdf.error ? (
        <p role="alert" className="p-8 text-center text-sm text-red-600">
          Could not generate the PDF: {String(pdf.error)}
        </p>
      ) : (
        pdf.url && <iframe title="PDF preview" src={pdf.url} className="flex-1 w-full" />
      )}
    </div>
  );
};

export default PdfFrame;
