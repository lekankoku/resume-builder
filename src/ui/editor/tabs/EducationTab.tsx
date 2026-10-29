import { Resume } from '../../../domain/resume/Resume';
import { ResumeActions } from '../../hooks/useResume';
import BulletList from '../components/BulletList';
import PeriodField from '../components/PeriodField';
import SortableSection from '../components/SortableSection';
import TextField from '../components/TextField';

interface Props {
  resume: Resume;
  actions: ResumeActions;
}

const EducationTab = ({ resume, actions }: Props) => (
  <SortableSection
    section="education"
    title="Academic Background"
    addLabel="Add Education"
    itemLabel="Education"
    items={resume.education}
    onAdd={() => actions.addItem('education')}
    onRemove={(idx) => actions.removeItem('education', idx)}
    onMove={(from, to) => actions.moveItem('education', from, to)}
    renderItem={(edu, idx) => (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Degree" value={edu.degree} onChange={(v) => actions.updateItemField('education', idx, 'degree', v)} />
          <TextField label="Institution" value={edu.institution} onChange={(v) => actions.updateItemField('education', idx, 'institution', v)} />
          <TextField label="Location" value={edu.location} onChange={(v) => actions.updateItemField('education', idx, 'location', v)} />
          <PeriodField
            value={edu.period}
            currentLabel="I currently study here"
            onChange={(v) => actions.updateItemField('education', idx, 'period', v)}
          />
        </div>
        <BulletList
          label="Highlights"
          addLabel="Add Highlight"
          bullets={edu.bullets}
          multiline
          onAdd={() => actions.addBullet('education', idx)}
          onChange={(bIdx, v) => actions.updateBullet('education', idx, bIdx, v)}
          onRemove={(bIdx) => actions.removeBullet('education', idx, bIdx)}
          onMove={(from, to) => actions.moveBullet('education', idx, from, to)}
        />
      </>
    )}
  />
);

export default EducationTab;
