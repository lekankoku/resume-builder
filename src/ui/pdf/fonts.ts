import { Font } from '@react-pdf/renderer';

export const registerPdfFonts = (resolve: (file: string) => string) => {
  Font.register({
    family: 'Inter',
    fonts: [
      { src: resolve('Inter-Regular.ttf') },
      { src: resolve('Inter-Bold.ttf'), fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
};
