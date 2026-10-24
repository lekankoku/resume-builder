import { Resume } from '../../../domain/resume/Resume';
import { ResumeActions } from '../../hooks/useResume';
import BulletList from '../components/BulletList';
import SortableSection from '../components/SortableSection';
import TextField from '../components/TextField';

interface Props {
  resume: Resume;
  actions: ResumeActions;
}

const AbilitiesTab = ({ resume, actions }: Props) => (
  <SortableSection
    section="abilities"
    title="Job Related Abilities"
    addLabel="Add Ability"
    itemLabel="Ability"
    items={resume.abilities}
    onAdd={() => actions.addItem('abilities')}
    onRemove={(idx) => actions.removeItem('abilities', idx)}
    onMove={(from, to) => actions.moveItem('abilities', from, to)}
    renderItem={(ability, idx) => (
      <>
        <TextField label="Title" value={ability.title} onChange={(v) => actions.updateItemField('abilities', idx, 'title', v)} />
        <BulletList
          label="Points"
          addLabel="Add Point"
          bullets={ability.bullets}
          onAdd={() => actions.addBullet('abilities', idx)}
          onChange={(bIdx, v) => actions.updateBullet('abilities', idx, bIdx, v)}
          onRemove={(bIdx) => actions.removeBullet('abilities', idx, bIdx)}
        />
      </>
    )}
  />
);

export default AbilitiesTab;
