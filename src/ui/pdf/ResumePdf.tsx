import React from 'react';
import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { cleanPhone, cleanUrl, displayUrl } from '../../domain/resume/contactFormat';
import { resumeDocumentTitle } from '../../domain/resume/documentTitle';
import { Resume } from '../../domain/resume/Resume';
import PageFooter from './PageFooter';
import { colors, documentDate, page } from './theme';

const styles = StyleSheet.create({
  page,
  header: { borderBottomWidth: 1.5, borderBottomColor: colors.ink, paddingBottom: 12, marginBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontFamily: 'Calistoga', fontSize: 28, color: colors.ink, textTransform: 'uppercase', lineHeight: 1.1 },
  title: { fontWeight: 700, fontSize: 11, letterSpacing: 2, color: colors.accent, textTransform: 'uppercase', marginTop: 4 },
  photo: { width: 64, height: 64, borderRadius: 8, objectFit: 'cover', objectPosition: 'top' },
  contacts: { flexDirection: 'row' },
  contactColumn: { flex: 1 },
  contact: { fontSize: 8, marginBottom: 3, color: colors.body },
  contactLabel: { fontWeight: 700, color: colors.accent },
  link: { color: colors.body },
  columns: { flexDirection: 'row' },
  main: { flex: 2, paddingRight: 14 },
  side: { flex: 1, paddingLeft: 12, borderLeftWidth: 0.5, borderLeftColor: colors.rule },
  section: { marginBottom: 12 },
  sectionHeading: {
    marginTop: 8,
    fontWeight: 700,
    fontSize: 8,
    letterSpacing: 2,
    color: colors.ink,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    paddingBottom: 3,
    marginBottom: 8,
  },
  sideHeading: { fontWeight: 700, fontSize: 8, letterSpacing: 1.5, color: colors.ink, textTransform: 'uppercase', marginBottom: 8 },
  item: { marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemTitle: { fontFamily: 'Calistoga', fontSize: 11, color: colors.ink, textTransform: 'uppercase', flex: 1, paddingRight: 8 },
  period: { fontSize: 7, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' },
  degree: { fontFamily: 'Calistoga', fontSize: 11, color: colors.ink, textTransform: 'uppercase', marginBottom: 2 },
  company: { fontWeight: 700, fontSize: 8.2, color: colors.body, textTransform: 'uppercase', marginBottom: 4 },
  location: { fontWeight: 400, fontSize: 7, color: colors.muted },
  bullet: { flexDirection: 'row', marginBottom: 2 },
  bulletMark: { width: 10, color: colors.accent, fontWeight: 700 },
  bulletText: { flex: 1 },
  scope: { fontWeight: 700, fontSize: 8, color: colors.body, marginBottom: 3 },
  abilityTitle: { fontWeight: 700, fontSize: 8, color: colors.ink, textTransform: 'uppercase', marginBottom: 3 },
  abilityBullet: { fontSize: 8.2 },
  techCategory: { fontWeight: 700, fontSize: 7, letterSpacing: 1, color: colors.muted, textTransform: 'uppercase' },
  techSkills: { fontWeight: 700, fontSize: 8.2, color: colors.ink, marginBottom: 6 },
  language: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3, fontSize: 8.2 },
  languageName: { fontWeight: 700, color: colors.ink },
  languageLevel: { fontSize: 7, fontWeight: 700, color: colors.accent, textTransform: 'uppercase' },
  referenceName: { fontWeight: 700, fontSize: 9, color: colors.ink },
  referenceRole: { fontSize: 7, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' },
  referenceCompany: { fontSize: 7, fontWeight: 700, color: colors.accent, textTransform: 'uppercase' },
  referenceLink: { fontSize: 7, color: colors.muted },
});

const Bullets: React.FC<{ items: string[]; mark?: string; style?: object }> = ({ items, mark = '•', style }) => (
  <View>
    {items.map((text, i) => (
      <View key={i} style={styles.bullet} wrap={false}>
        <Text style={styles.bulletMark}>{mark}</Text>
        <Text style={[styles.bulletText, style ?? {}]}>{text}</Text>
      </View>
    ))}
  </View>
);

const Section: React.FC<{ heading: string; keepTogether?: boolean; children: React.ReactNode }> = ({ heading, keepTogether, children }) => {
  const content = (
    <>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {children}
    </>
  );
  return keepTogether ? <View wrap={false}>{content}</View> : content;
};

const SideSection: React.FC<{ heading: string; children: React.ReactNode }> = ({ heading, children }) => (
  <View style={styles.section} wrap={false}>
    <Text style={styles.sideHeading}>
      {heading}
    </Text>
    {children}
  </View>
);

const Contact: React.FC<{ label: string; href?: string; children: string }> = ({ label, href, children }) => (
  <Text style={styles.contact}>
    <Text style={styles.contactLabel}>{label}  </Text>
    {href ? (
      <Link src={href} style={styles.link}>
        {children}
      </Link>
    ) : (
      children
    )}
  </Text>
);

const ResumePdf: React.FC<{ resume: Resume; targetCompany: string }> = ({ resume, targetCompany }) => {
  const { personal } = resume;
  return (
    <Document title={resumeDocumentTitle(personal, targetCompany)} author={personal.name} creationDate={documentDate}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{personal.name}</Text>
              <Text style={styles.title}>{personal.title}</Text>
            </View>
            {personal.photoUrl && <Image src={cleanUrl(personal.photoUrl)} style={styles.photo} />}
          </View>
          <View style={styles.contacts}>
            <View style={styles.contactColumn}>
              <Contact label="Email" href={`mailto:${cleanUrl(personal.email)}`}>{displayUrl(personal.email)}</Contact>
              <Contact label="Phone" href={`tel:${cleanPhone(personal.phone)}`}>{personal.phone}</Contact>
              <Contact label="Location">{personal.residence}</Contact>
            </View>
            <View style={styles.contactColumn}>
              <Contact label="Web" href={cleanUrl(personal.website)}>{displayUrl(personal.website)}</Contact>
              <Contact label="LinkedIn" href={cleanUrl(personal.linkedin)}>{displayUrl(personal.linkedin)}</Contact>
              <Contact label="GitHub" href={cleanUrl(personal.github)}>{displayUrl(personal.github)}</Contact>
            </View>
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.main}>
            <Section heading="Experience">
              {resume.experiences.map((exp, i) => (
                <View key={i} style={styles.item} wrap={false}>
                  <View style={styles.row}>
                    <Text style={styles.itemTitle}>{exp.role}</Text>
                    <Text style={styles.period}>{exp.period}</Text>
                  </View>
                  <Text style={styles.company}>
                    {exp.company}
                    {exp.location ? <Text style={styles.location}>{`  |  ${exp.location}`}</Text> : null}
                  </Text>
                  <Bullets items={exp.bullets} />
                </View>
              ))}
            </Section>

            <Section heading="Key Projects">
              {resume.projects.map((proj, i) => (
                <View key={i} style={styles.item} wrap={false}>
                  <View style={styles.row}>
                    <Text style={styles.itemTitle}>{proj.title}</Text>
                    <Text style={styles.period}>{proj.company}</Text>
                  </View>
                  <Text style={styles.scope}>{proj.scope}</Text>
                  <Bullets items={proj.bullets} mark="›" />
                </View>
              ))}
            </Section>

            <Section heading="Academic" keepTogether>
              {resume.education.map((edu, i) => (
                <View key={i} style={[styles.row, styles.item]} wrap={false}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.degree}>{edu.degree}</Text>
                    <Text style={[styles.company, { color: colors.accent, marginBottom: 0 }]}>{edu.institution}</Text>
                  </View>
                  <View>
                    <Text style={[styles.period, { textAlign: 'right' }]}>{edu.period}</Text>
                    <Text style={[styles.location, { textAlign: 'right' }]}>{edu.location}</Text>
                  </View>
                </View>
              ))}
            </Section>
          </View>

          <View style={styles.side}>
            <SideSection heading="Job related abilities">
              {resume.abilities.map((ability, i) => (
                <View key={i} style={styles.item} wrap={false}>
                  <Text style={styles.abilityTitle}>{ability.title}</Text>
                  <Bullets items={ability.bullets} style={styles.abilityBullet} />
                </View>
              ))}
            </SideSection>

            <SideSection heading="Tech Stack">
              {resume.technicalProficiency.map((tp, i) => (
                <View key={i} wrap={false}>
                  <Text style={styles.techCategory}>{tp.category}</Text>
                  <Text style={styles.techSkills}>{tp.skills}</Text>
                </View>
              ))}
            </SideSection>

            <SideSection heading="Languages">
              {resume.languages.map((lang, i) => (
                <View key={i} style={styles.language} wrap={false}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  <Text style={styles.languageLevel}>{lang.level}</Text>
                </View>
              ))}
            </SideSection>

            <SideSection heading="References">
              {resume.references.map((ref, i) => (
                <View key={i} style={styles.item} wrap={false}>
                  <Text style={styles.referenceName}>{ref.name}</Text>
                  <Text style={styles.referenceRole}>{ref.role}</Text>
                  <Text style={styles.referenceCompany}>{ref.company}</Text>
                  <Link src={cleanUrl(ref.linkedin)} style={styles.referenceLink}>
                    LinkedIn Profile
                  </Link>
                </View>
              ))}
            </SideSection>
          </View>
        </View>

        <PageFooter website={personal.website} />
      </Page>
    </Document>
  );
};

export default ResumePdf;
