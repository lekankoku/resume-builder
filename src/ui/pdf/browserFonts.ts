import { registerPdfFonts } from './fonts';

// Imported for its side effect: registers the PDF fonts once, served from public/fonts.
registerPdfFonts((file) => `/fonts/${file}`);
