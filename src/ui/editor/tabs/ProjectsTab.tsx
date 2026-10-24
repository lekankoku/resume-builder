import { Resume } from '../../../domain/resume/Resume';
import { ResumeActions } from '../../hooks/useResume';
import BulletList from '../components/BulletList';
import SortableSection from '../components/SortableSection';
import TextField from '../components/TextField';

interface Props {
  resume: Resume;
  actions: ResumeActions;
}

const ProjectsTab = ({ resume, actions }: Props) => (
  <SortableSection
    section="projects"
    title="Key Projects"
    addLabel="Add Project"
    itemLabel="Project"
    items={resume.projects}
    onAdd={() => actions.addItem('projects')}
    onRemove={(idx) => actions.removeItem('projects', idx)}
    onMove={(from, to) => actions.moveItem('projects', from, to)}
    renderItem={(proj, idx) => (
      <>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Title" value={proj.title} onChange={(v) => actions.updateItemField('projects', idx, 'title', v)} />
          <TextField label="Company" value={proj.company} onChange={(v) => actions.updateItemField('projects', idx, 'company', v)} />
        </div>
        <TextField label="Scope" value={proj.scope} onChange={(v) => actions.updateItemField('projects', idx, 'scope', v)} />
        <BulletList
          label="Details"
          addLabel="Add Detail"
          bullets={proj.bullets}
          multiline
          onAdd={() => actions.addBullet('projects', idx)}
          onChange={(bIdx, v) => actions.updateBullet('projects', idx, bIdx, v)}
          onRemove={(bIdx) => actions.removeBullet('projects', idx, bIdx)}
        />
      </>
    )}
  />
);

export default ProjectsTab;
