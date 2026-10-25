import { Resume } from '../../../domain/resume/Resume';
import { ResumeActions } from '../../hooks/useResume';
import BulletList from '../components/BulletList';
import SortableSection from '../components/SortableSection';
import TextField from '../components/TextField';

interface Props {
  resume: Resume;
  actions: ResumeActions;
}

const ExperienceTab = ({ resume, actions }: Props) => (
  <SortableSection
    section="experiences"
    title="Experience History"
    addLabel="Add Experience"
    itemLabel="Experience"
    items={resume.experiences}
    onAdd={() => actions.addItem('experiences')}
    onRemove={(idx) => actions.removeItem('experiences', idx)}
    onMove={(from, to) => actions.moveItem('experiences', from, to)}
    renderItem={(exp, idx) => (
      <>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Role" value={exp.role} onChange={(v) => actions.updateItemField('experiences', idx, 'role', v)} />
          <TextField label="Company" value={exp.company} onChange={(v) => actions.updateItemField('experiences', idx, 'company', v)} />
          <TextField label="Location" value={exp.location} onChange={(v) => actions.updateItemField('experiences', idx, 'location', v)} />
          <TextField label="Period" value={exp.period} onChange={(v) => actions.updateItemField('experiences', idx, 'period', v)} />
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Employment Type
            <select
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
              value={exp.employmentType ?? ''}
              onChange={(e) => actions.updateItemField('experiences', idx, 'employmentType', e.target.value)}
            >
              <option value="">Not specified</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
            </select>
          </label>
        </div>
        <BulletList
          label="Highlights"
          addLabel="Add Bullet"
          bullets={exp.bullets}
          multiline
          onAdd={() => actions.addBullet('experiences', idx)}
          onChange={(bIdx, v) => actions.updateBullet('experiences', idx, bIdx, v)}
          onRemove={(bIdx) => actions.removeBullet('experiences', idx, bIdx)}
        />
      </>
    )}
  />
);

export default ExperienceTab;
