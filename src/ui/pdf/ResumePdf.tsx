import React, { createContext, useContext } from 'react';
import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { cleanPhone, cleanUrl, displayUrl } from '../../domain/resume/contactFormat';
import { resumeDocumentTitle } from '../../domain/resume/documentTitle';
import { Resume } from '../../domain/resume/Resume';
import { sidebarBullets, sidebarTechStack } from '../../domain/resume/sidebar';
import PageFooter from './PageFooter';
import { colors, documentDate, page } from './theme';

// Inter throughout. Body text is 9pt at full size and never below 8.1pt after fitting (see DENSITIES);
// small labels stay at 7.5pt or more.
const baseStyles = {
  page: { ...page },
  header: { borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: 10, marginBottom: 2 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontWeight: 700, fontSize: 22, color: colors.ink, lineHeight: 1.15 },
  title: { fontWeight: 700, fontSize: 11, color: colors.accent, marginTop: 3 },
  currentRole: { fontSize: 8.8, color: colors.body, marginTop: 2 },
  photo: { width: 68, height: 68, borderRadius: 8, objectFit: 'cover', objectPosition: 'top', marginLeft: 14 },
  contacts: { flexDirection: 'row', marginTop: 8 },
  contactColumn: { flex: 1 },
  contact: { fontSize: 8, marginBottom: 2, color: colors.body },
  contactLabel: { fontWeight: 700, color: colors.ink },
  link: { color: colors.body },
  columns: { flexDirection: 'row' },
  main: { flex: 2, paddingRight: 14 },
  side: { flex: 1, paddingLeft: 12, borderLeftWidth: 0.5, borderLeftColor: colors.rule },
  section: { marginTop: 6 },
  sectionHeading: {
    marginTop: 8,
    fontWeight: 700,
    fontSize: 8.5,
    letterSpacing: 1.2,
    color: colors.ink,
    textTransform: 'uppercase',
    borderBottomWidth: 0.75,
    borderBottomColor: colors.ink,
    paddingBottom: 2,
    marginBottom: 7,
  },
  sideHeading: { fontWeight: 700, fontSize: 7, letterSpacing: 0.6, color: colors.ink, textTransform: 'uppercase', marginBottom: 3 },
  sideItem: { marginBottom: 3 },
  item: { marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemTitle: { fontWeight: 700, fontSize: 10, color: colors.ink, flex: 1, paddingRight: 8 },
  period: { fontSize: 7.8, color: colors.muted },
  degree: { fontWeight: 700, fontSize: 10, color: colors.ink },
  company: { fontWeight: 700, fontSize: 8.8, color: colors.body, marginBottom: 3 },
  location: { fontWeight: 400, fontSize: 7.8, color: colors.muted },
  earlierRole: { fontWeight: 700, fontSize: 8.5, color: colors.muted, marginBottom: 2 },
  bullet: { flexDirection: 'row', marginBottom: 2 },
  bulletMark: { width: 10, color: colors.accent, fontWeight: 700 },
  bulletText: { flex: 1 },
  scope: { fontStyle: 'normal', fontSize: 8.8, color: colors.body, marginBottom: 3 },
  abilityTitle: { fontWeight: 700, fontSize: 7.2, color: colors.ink, marginBottom: 0.5 },
  abilityBullet: { fontSize: 7.8 },
  techCategory: { fontWeight: 700, fontSize: 7.8, color: colors.ink },
  techSkills: { fontSize: 7.8, marginBottom: 3 },
  language: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, fontSize: 7.8 },
  languageName: { fontWeight: 700, color: colors.ink },
  languageLevel: { fontSize: 7.8 },
  referenceName: { fontWeight: 700, fontSize: 7.8, color: colors.ink },
  referenceRole: { fontSize: 7.8 },
  referenceCompany: { fontSize: 7.8 },
  referenceLink: { fontSize: 7.8, color: colors.body },
} as const;

type Styles = { [K in keyof typeof baseStyles]: object };

const SCALED = new Set([
  'fontSize',
  'letterSpacing',
  'width',
  'height',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingHorizontal',
]);

const scaleStyle = (style: object, density: number) =>
  Object.fromEntries(Object.entries(style).map(([key, value]) => [key, SCALED.has(key) && typeof value === 'number' ? value * density : value]));

const stylesByDensity = new Map<number, Styles>();

// Shrinks text and spacing together so a CV that just spills over fits its page budget.
const stylesFor = (density: number): Styles => {
  let styles = stylesByDensity.get(density);
  if (!styles) {
    // The page margins stay fixed; only its base font size scales.
    const scaled = Object.fromEntries(
      Object.entries(baseStyles).map(([name, style]) => [
        name,
        name === 'page' ? { ...style, fontSize: baseStyles.page.fontSize * density } : scaleStyle(style, density),
      ]),
    );
    styles = StyleSheet.create(scaled) as Styles;
    stylesByDensity.set(density, styles);
  }
  return styles;
};

// Bullets kept on the same page as their entry's heading, so a heading never ends a page alone.
const LEADING_BULLETS = 2;

const StylesContext = createContext<Styles>(stylesFor(1));
const useStyles = () => useContext(StylesContext);

const Bullets: React.FC<{ items: string[]; mark?: string; style?: object }> = ({ items, mark = '•', style }) => {
  const styles = useStyles();
  return (
    <View>
      {items.map((text, i) => (
        <View key={i} style={styles.bullet} wrap={false}>
          <Text style={styles.bulletMark}>{mark}</Text>
          <Text style={[styles.bulletText, style ?? {}]}>{text}</Text>
        </View>
      ))}
    </View>
  );
};

// An entry may break across pages between bullets; its heading stays with the first bullets.
const Entry: React.FC<{ heading: React.ReactNode; bullets: string[]; mark?: string }> = ({ heading, bullets, mark }) => {
  const styles = useStyles();
  return (
    <View style={styles.item}>
      <View wrap={false}>
        {heading}
        <Bullets items={bullets.slice(0, LEADING_BULLETS)} mark={mark} />
      </View>
      <Bullets items={bullets.slice(LEADING_BULLETS)} mark={mark} />
    </View>
  );
};

const Section: React.FC<{ heading: string; children: React.ReactNode }> = ({ heading, children }) => {
  const styles = useStyles();
  return (
    <>
      <Text style={styles.sectionHeading} minPresenceAhead={120}>{heading}</Text>
      {children}
    </>
  );
};

const SideSection: React.FC<{ heading: string; children: React.ReactNode }> = ({ heading, children }) => {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sideHeading} minPresenceAhead={40}>
        {heading}
      </Text>
      {children}
    </View>
  );
};

const Contact: React.FC<{ label: string; href?: string; children: string }> = ({ label, href, children }) => {
  const styles = useStyles();
  return (
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
};

interface Props {
  resume: Resume;
  targetCompany: string;
  density?: number;
}

const ResumePdf: React.FC<Props> = ({ resume, targetCompany, density = 1 }) => (
  <StylesContext.Provider value={stylesFor(density)}>
    <ResumePages resume={resume} targetCompany={targetCompany} />
  </StylesContext.Provider>
);

const ResumePages: React.FC<Omit<Props, 'density'>> = ({ resume, targetCompany }) => {
  const styles = useStyles();
  const { personal } = resume;
  const experience = resume.experiences.length > 0 && (
    <Section key="experience" heading="Experience">
      {resume.experiences.map((exp, i) => (
        <Entry
          key={i}
          bullets={exp.bullets}
          heading={
            <>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{exp.role}</Text>
                <Text style={styles.period}>{exp.period}</Text>
              </View>
              <Text style={styles.company}>
                {exp.company}
                {exp.location ? <Text style={styles.location}>{`  |  ${exp.location}`}</Text> : null}
                {exp.employmentType ? <Text style={styles.location}>{`  |  ${exp.employmentType}`}</Text> : null}
              </Text>
              {exp.earlierPositions.map((position, pi) => (
                <View key={pi} style={styles.row}>
                  <Text style={styles.earlierRole}>{position.role}</Text>
                  <Text style={styles.period}>{position.period}</Text>
                </View>
              ))}
            </>
          }
        />
      ))}
    </Section>
  );

  const projects = resume.projects.length > 0 && (
    <Section key="projects" heading="Key Projects">
      {resume.projects.map((proj, i) => (
        <Entry
          key={i}
          bullets={proj.bullets}
          mark="›"
          heading={
            <>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{proj.title}</Text>
                <Text style={styles.period}>{[proj.company, proj.period].filter(Boolean).join('  ·  ')}</Text>
              </View>
              <Text style={styles.scope}>{proj.scope}</Text>
            </>
          }
        />
      ))}
    </Section>
  );

  const volunteering = resume.volunteering.length > 0 && (
    <Section key="volunteering" heading="Volunteering">
      {resume.volunteering.map((item, i) => (
        <Entry
          key={i}
          bullets={item.bullets}
          heading={
            <>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{item.role}</Text>
                <Text style={styles.period}>{item.period}</Text>
              </View>
              <Text style={styles.company}>
                {item.organization}
                {item.location ? <Text style={styles.location}>{`  |  ${item.location}`}</Text> : null}
              </Text>
            </>
          }
        />
      ))}
    </Section>
  );

  const education = resume.education.length > 0 && (
    <Section key="education" heading="Education">
      {resume.education.map((edu, i) => (
        <Entry
          key={i}
          bullets={edu.bullets}
          heading={
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.degree}>{edu.degree}</Text>
                <Text style={[styles.company, { color: colors.accent, marginBottom: 0 }]}>{edu.institution}</Text>
              </View>
              <View>
                <Text style={[styles.period, { textAlign: 'right' }]}>{edu.period}</Text>
                <Text style={[styles.location, { textAlign: 'right' }]}>{edu.location}</Text>
              </View>
            </View>
          }
        />
      ))}
    </Section>
  );

  return (
    <Document title={resumeDocumentTitle(personal, targetCompany)} author={personal.name} creationDate={documentDate}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{personal.name}</Text>
              <Text style={styles.title}>{personal.title}</Text>
              {personal.currentRole ? (
                <Text style={styles.currentRole}>{[personal.currentRole, personal.currentCompany].filter(Boolean).join('  ·  ')}</Text>
              ) : null}
              <View style={styles.contacts}>
                <View style={styles.contactColumn}>
                  <Contact label="Email" href={`mailto:${cleanUrl(personal.email)}`}>{displayUrl(personal.email)}</Contact>
                  <Contact label="Phone" href={`tel:${cleanPhone(personal.phone)}`}>{personal.phone}</Contact>
                  <Contact label="Location">{personal.residence}</Contact>
                  {personal.nationality ? <Contact label="Nationality">{personal.nationality}</Contact> : null}
                </View>
                <View style={styles.contactColumn}>
                  <Contact label="Web" href={cleanUrl(personal.website)}>{displayUrl(personal.website)}</Contact>
                  <Contact label="LinkedIn" href={cleanUrl(personal.linkedin)}>{displayUrl(personal.linkedin)}</Contact>
                  <Contact label="GitHub" href={cleanUrl(personal.github)}>{displayUrl(personal.github)}</Contact>
                </View>
              </View>
            </View>
            {personal.photoUrl && <Image src={cleanUrl(personal.photoUrl)} style={styles.photo} />}
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.main}>
            {resume.layout === 'education-first'
              ? [education, experience, projects, volunteering]
              : [experience, projects, volunteering, education]}
          </View>

          <View style={styles.side}>
            <SideSection heading="Job related abilities">
              {resume.abilities.map((ability, i) => (
                <View key={i} style={styles.sideItem} wrap={false}>
                  <Text style={styles.abilityTitle}>{ability.title}</Text>
                  <Bullets items={sidebarBullets(ability.bullets)} style={styles.abilityBullet} />
                </View>
              ))}
            </SideSection>

            {(resume.crossFunctional.title || resume.crossFunctional.bullets.length > 0) && (
              <SideSection heading={resume.crossFunctional.title || 'Leadership'}>
                <Bullets items={sidebarBullets(resume.crossFunctional.bullets)} style={styles.abilityBullet} />
              </SideSection>
            )}

            {resume.technicalProficiency.length > 0 && (
              <SideSection heading="Tech Stack">
                {sidebarTechStack(resume.technicalProficiency).map((tp, i) => (
                  <View key={i} wrap={false}>
                    {tp.category ? <Text style={styles.techCategory}>{tp.category}</Text> : null}
                    <Text style={styles.techSkills}>{tp.skills}</Text>
                  </View>
                ))}
              </SideSection>
            )}

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
                <View key={i} style={styles.sideItem} wrap={false}>
                  <Text style={styles.referenceName}>{ref.name}</Text>
                  <Text style={styles.referenceRole}>{ref.role}</Text>
                  <Text style={styles.referenceCompany}>{ref.company}</Text>
                  {ref.contact ? <Text style={styles.referenceLink}>{ref.contact}</Text> : null}
                  {ref.linkedin ? (
                    <Link src={cleanUrl(ref.linkedin)} style={styles.referenceLink}>
                      LinkedIn Profile
                    </Link>
                  ) : null}
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
