import StarRating from './StarRating';
import { db } from '../../mocks/db';

export default function TaskDone({ record }) {
  const { user_name, completed_at, task_title, rating, assignment_id, task_id } = record || {};

  // if rating provided use it; otherwise compute average from evaluations with same assignment_id
  let displayRating = rating ?? null;
  if (displayRating == null && assignment_id != null) {
    const evals = db.evaluations.filter((ev) => ev.assignment_id === assignment_id);
    if (evals.length > 0) {
      const sum = evals.reduce((s, e) => s + (e.rating || 0), 0);
      displayRating = Math.round(sum / evals.length);
    }
  }

  // date as YYYY/MM/DD
  const dateStr = completed_at ? new Date(completed_at).toISOString().slice(0,10).replace(/-/g, '/') : '';
  const avatarText = user_name ? user_name.slice(0,2) : '?';

  // try to find task description from db if available
  const task = db.tasks.find((t) => String(t.task_id) === String(task_id));
  const description = record.description || task?.description || '';

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 44, height: 44, borderRadius: 44, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
        {avatarText}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{task_title}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{dateStr}</div>
        </div>

        <div style={{ marginTop: 6, color: '#666', fontSize: 13 }}>{description}</div>
      </div>

      <div style={{ marginLeft: 12 }}>
        <StarRating value={displayRating || 0} editable={false} />
      </div>
    </div>
  );
}
