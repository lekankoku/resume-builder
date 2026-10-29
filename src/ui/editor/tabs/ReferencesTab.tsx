import { Resume } from '../../../domain/resume/Resume';
import { ResumeActions } from '../../hooks/useResume';
import SortableSection from '../components/SortableSection';
import TextField from '../components/TextField';

interface Props {
  resume: Resume;
  actions: ResumeActions;
}

const ReferencesTab = ({ resume, actions }: Props) => (
  <SortableSection
    section="references"
    title="Professional References"
    addLabel="Add Reference"
    itemLabel="Reference"
    items={resume.references}
    onAdd={() => actions.addItem('references')}
    onRemove={(idx) => actions.removeItem('references', idx)}
    onMove={(from, to) => actions.moveItem('references', from, to)}
    renderItem={(ref, idx) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Name" value={ref.name} onChange={(v) => actions.updateItemField('references', idx, 'name', v)} />
        <TextField label="Role" value={ref.role} onChange={(v) => actions.updateItemField('references', idx, 'role', v)} />
        <TextField label="Company" value={ref.company} onChange={(v) => actions.updateItemField('references', idx, 'company', v)} />
        <TextField label="Contact (email or phone)" value={ref.contact} onChange={(v) => actions.updateItemField('references', idx, 'contact', v)} />
        <TextField label="LinkedIn" value={ref.linkedin} onChange={(v) => actions.updateItemField('references', idx, 'linkedin', v)} />
      </div>
    )}
  />
);

export default ReferencesTab;
