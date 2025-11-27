import StarRating from './StarRating';
import { db } from '../../mocks/db';

export default function TaskEvaluation({ evaluations = [] }) {
  // sort by created_at desc
  const sorted = [...evaluations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sorted.map((ev) => {
        const isAnonymous = ev.is_anonymous;
        let name = '알수없음';
        if (isAnonymous) name = '익명';
        else if (ev.evaluator_id != null) {
          const u = db.users.find((x) => x.user_id === ev.evaluator_id);
          if (u) name = u.user_name || '알수없음';
        }

        const avatarText = isAnonymous ? '익' : (name ? name.slice(0, 2) : '?');
        const dateStr = ev.created_at ? new Date(ev.created_at).toISOString().slice(0,10).replace(/-/g, '/') : '';

        return (
          <div key={ev.task_evaluation_id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, borderRadius: 44, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
              {avatarText}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{dateStr}</div>
              </div>

              <div style={{ marginTop: 6, color: '#333', fontSize: 13, display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>{ev.comment}</div>
                <div style={{ marginLeft: 12 }}>
                  <StarRating value={ev.rating || 0} editable={false} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
