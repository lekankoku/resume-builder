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

const VolunteeringTab = ({ resume, actions }: Props) => (
  <SortableSection
    section="volunteering"
    title="Volunteering and Other Projects"
    addLabel="Add Volunteering"
    itemLabel="Volunteering"
    items={resume.volunteering}
    onAdd={() => actions.addItem('volunteering')}
    onRemove={(idx) => actions.removeItem('volunteering', idx)}
    onMove={(from, to) => actions.moveItem('volunteering', from, to)}
    renderItem={(item, idx) => (
      <>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Role" value={item.role} onChange={(v) => actions.updateItemField('volunteering', idx, 'role', v)} />
          <TextField label="Organization" value={item.organization} onChange={(v) => actions.updateItemField('volunteering', idx, 'organization', v)} />
          <TextField label="Location" value={item.location} onChange={(v) => actions.updateItemField('volunteering', idx, 'location', v)} />
          <PeriodField
            value={item.period}
            currentLabel="I am still doing this"
            onChange={(v) => actions.updateItemField('volunteering', idx, 'period', v)}
          />
        </div>
        <BulletList
          label="Highlights"
          addLabel="Add Highlight"
          bullets={item.bullets}
          multiline
          onAdd={() => actions.addBullet('volunteering', idx)}
          onChange={(bIdx, v) => actions.updateBullet('volunteering', idx, bIdx, v)}
          onRemove={(bIdx) => actions.removeBullet('volunteering', idx, bIdx)}
        />
      </>
    )}
  />
);

export default VolunteeringTab;
