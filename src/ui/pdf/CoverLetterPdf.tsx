import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { CoverLetter } from '../../domain/coverLetter/CoverLetter';
import { displayUrl } from '../../domain/resume/contactFormat';
import { coverLetterDocumentTitle } from '../../domain/resume/documentTitle';
import { Resume } from '../../domain/resume/Resume';
import PageFooter from './PageFooter';
import { colors, documentDate, page } from './theme';

const styles = StyleSheet.create({
  page: { ...page, fontSize: 10.5, lineHeight: 1.55, paddingTop: 52, paddingHorizontal: 56 },
  header: { borderBottomWidth: 1.5, borderBottomColor: colors.ink, paddingBottom: 12, marginBottom: 28 },
  name: { fontFamily: 'Calistoga', fontSize: 24, color: colors.ink, textTransform: 'uppercase', marginBottom: 6 },
  contact: { fontSize: 8.5, color: colors.body },
  date: { fontWeight: 700, marginBottom: 14 },
  recipient: { marginBottom: 24 },
  bold: { fontWeight: 700 },
  company: { fontWeight: 700, color: colors.accent },
  subject: { fontWeight: 700, color: colors.ink, marginBottom: 14 },
  paragraph: { textAlign: 'justify', marginBottom: 10 },
});

const CoverLetterPdf: React.FC<{ resume: Resume; coverLetter: CoverLetter; targetCompany: string }> = ({
  resume,
  coverLetter,
  targetCompany,
}) => {
  const { personal } = resume;
  const paragraphs = coverLetter.body.split('\n').filter((p) => p.trim());
  return (
    <Document title={coverLetterDocumentTitle(personal, targetCompany)} author={personal.name} creationDate={documentDate}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{personal.name}</Text>
          <Text style={styles.contact}>
            {[displayUrl(personal.email), personal.phone, personal.residence].filter(Boolean).join('   |   ')}
          </Text>
        </View>

        <Text style={styles.date}>{coverLetter.date}</Text>
        <View style={styles.recipient}>
          {coverLetter.recipientName && <Text style={styles.bold}>{coverLetter.recipientName}</Text>}
          {coverLetter.recipientTitle && <Text>{coverLetter.recipientTitle}</Text>}
          {targetCompany && <Text style={styles.company}>{targetCompany}</Text>}
          {coverLetter.companyAddress && <Text>{coverLetter.companyAddress}</Text>}
        </View>

        {coverLetter.subject ? <Text style={styles.subject}>{coverLetter.subject}</Text> : null}

        {paragraphs.map((paragraph, i) => (
          <Text key={i} style={styles.paragraph} orphans={2} widows={2}>
            {paragraph}
          </Text>
        ))}

        <PageFooter website={personal.website} />
      </Page>
    </Document>
  );
};

export default CoverLetterPdf;
