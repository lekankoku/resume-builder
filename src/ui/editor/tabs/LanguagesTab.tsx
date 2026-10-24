import { Resume } from '../../../domain/resume/Resume';
import { ResumeActions } from '../../hooks/useResume';
import SortableSection from '../components/SortableSection';
import TextField from '../components/TextField';

interface Props {
  resume: Resume;
  actions: ResumeActions;
}

const LanguagesTab = ({ resume, actions }: Props) => (
  <SortableSection
    section="languages"
    title="Language Proficiency"
    addLabel="Add Language"
    itemLabel="Language"
    items={resume.languages}
    onAdd={() => actions.addItem('languages')}
    onRemove={(idx) => actions.removeItem('languages', idx)}
    onMove={(from, to) => actions.moveItem('languages', from, to)}
    renderItem={(lang, idx) => (
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Name" value={lang.name} onChange={(v) => actions.updateItemField('languages', idx, 'name', v)} />
        <TextField label="Level" value={lang.level} onChange={(v) => actions.updateItemField('languages', idx, 'level', v)} />
      </div>
    )}
  />
);

export default LanguagesTab;
