import { Resume } from '../../../domain/resume/Resume';
import { ResumeActions } from '../../hooks/useResume';
import SortableSection from '../components/SortableSection';
import TextField from '../components/TextField';

interface Props {
  resume: Resume;
  actions: ResumeActions;
}

const TechStackTab = ({ resume, actions }: Props) => (
  <SortableSection
    section="technicalProficiency"
    title="Technical Proficiency"
    addLabel="Add Category"
    itemLabel="Category"
    items={resume.technicalProficiency}
    onAdd={() => actions.addItem('technicalProficiency')}
    onRemove={(idx) => actions.removeItem('technicalProficiency', idx)}
    onMove={(from, to) => actions.moveItem('technicalProficiency', from, to)}
    renderItem={(tech, idx) => (
      <div className="space-y-4">
        <TextField label="Category" value={tech.category} onChange={(v) => actions.updateItemField('technicalProficiency', idx, 'category', v)} />
        <TextField
          label="Skills"
          value={tech.skills}
          multiline
          minHeightClass="min-h-[80px]"
          onChange={(v) => actions.updateItemField('technicalProficiency', idx, 'skills', v)}
        />
      </div>
    )}
  />
);

export default TechStackTab;
