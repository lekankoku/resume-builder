import { Resume } from '../../../domain/resume/Resume';
import { ResumeActions } from '../../hooks/useResume';
import BulletList from '../components/BulletList';
import TextField from '../components/TextField';

interface Props {
  resume: Resume;
  actions: ResumeActions;
}

const LeadershipTab = ({ resume, actions }: Props) => (
  <div className="space-y-6">
    <div className="border-b pb-4">
      <h2 className="text-xl font-display text-slate-900">Leadership</h2>
      <p className="text-sm text-slate-500 mt-2">
        Strengths the job does not ask for directly, such as leadership or public speaking. Leave it empty to hide the section.
      </p>
    </div>
    <TextField label="Section title" value={resume.crossFunctional.title} onChange={actions.updateCrossFunctionalTitle} />
    <BulletList
      label="Highlights"
      addLabel="Add Highlight"
      bullets={resume.crossFunctional.bullets}
      onAdd={actions.addCrossFunctionalBullet}
      onChange={actions.updateCrossFunctionalBullet}
      onRemove={actions.removeCrossFunctionalBullet}
      onMove={actions.moveCrossFunctionalBullet}
    />
  </div>
);

export default LeadershipTab;
