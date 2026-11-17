// react-pdf writes one "/Type /Page" object per page (the page tree is "/Type /Pages").
export const pageCountOf = (pdf: Uint8Array): number => (new TextDecoder('latin1').decode(pdf).match(/\/Type \/Page\n/g) ?? []).length;
