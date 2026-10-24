import { Resume } from '../../../domain/resume/Resume';
import { ResumeActions } from '../../hooks/useResume';
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
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Degree" value={edu.degree} onChange={(v) => actions.updateItemField('education', idx, 'degree', v)} />
        <TextField label="Institution" value={edu.institution} onChange={(v) => actions.updateItemField('education', idx, 'institution', v)} />
        <TextField label="Location" value={edu.location} onChange={(v) => actions.updateItemField('education', idx, 'location', v)} />
        <TextField label="Period" value={edu.period} onChange={(v) => actions.updateItemField('education', idx, 'period', v)} />
      </div>
    )}
  />
);

export default EducationTab;
