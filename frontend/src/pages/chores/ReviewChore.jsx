import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ChoresLayout from '../../components/layout/ChoresLayout';
import StarRating from '../../components/ui/StarRating';
import { db } from '../../mocks/db';

export default function ReviewChore() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const task = db.tasks.find(t => String(t.task_id) === String(taskId));

  const storedRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let storedUser = null;
  try { if (storedRaw) storedUser = JSON.parse(storedRaw); } catch(e){}
  const currentUserId = (storedUser && storedUser.user_id) || (typeof window !== 'undefined' && Number(localStorage.getItem('user_id')));

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const assignedUser = task.assigned_to != null ? db.users.find(u => u.user_id === task.assigned_to) : null;

  if (!task) return <ChoresLayout>집안일을 찾을 수 없습니다.</ChoresLayout>;

  function handleComplete() {
    if (!rating || rating < 1) return alert('별점을 선택하세요.');

    // For mock data, use assignment_id = task.task_id (placeholder)
    const assignment_id = Number(task.task_id);
    const evaluator_id = Number(currentUserId || 0);

    // ensure unique (assignment_id, evaluator_id)
    db.task_evaluations = db.task_evaluations || [];
    const exists = db.task_evaluations.some(ev => Number(ev.assignment_id) === assignment_id && Number(ev.evaluator_id) === evaluator_id);
    if (exists) {
      alert('이미 평가하셨습니다.');
      navigate(-1);
      return;
    }

    // determine new id
    let newId = 1;
    if (db.counters && typeof db.counters.task_evaluation_id !== 'undefined') {
      newId = ++db.counters.task_evaluation_id;
    } else {
      const max = db.task_evaluations.reduce((m, e) => Math.max(m, Number(e.task_evaluation_id || e.id || 0)), 0);
      newId = max + 1;
    }

    const rec = {
      task_evaluation_id: newId,
      assignment_id,
      evaluator_id,
      rating: Number(rating),
      comment: comment.trim() || null,
      is_anonymous: !!isAnonymous,
      created_at: new Date().toISOString(),
    };

    db.task_evaluations.push(rec);
    console.log('Saved evaluation', rec);
    alert('평가가 등록되었습니다.');
    navigate(-1);
  }

  return (
    <ChoresLayout>
      <div style={{ padding: 20, minHeight: '80vh', boxSizing: 'border-box', position: 'relative', paddingBottom: 120 }}>
        <h2 style={{ marginTop: 0 }}>평가 작성</h2>

        <div style={{ background: '#fff', padding: 18, borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{task.title}</div>
            {task.assigned_to != null && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>배정자: {assignedUser ? assignedUser.user_name : '알수없음'}</div>
            )}
            <div style={{ color: '#666', marginTop: 6 }}>완료된 집안일에 대해 평가를 남겨주세요.</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <StarRating value={rating} editable={true} onChange={(v) => setRating(v)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} /> <span style={{ color: '#666' }}>익명으로 평가하기</span>
            </label>
          </div>

          <textarea value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="완료된 집안일에 평가의 한마디를 남겨보세요." rows={8} style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 8, border: '1px solid #e6e6e6', resize: 'vertical', color: '#333' }} />

        </div>

        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: 'flex', gap: 12, zIndex: 1200 }}>
          <button onClick={() => navigate(-1)} style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: '1px solid #DF6437', background: '#fff', color: '#DF6437', fontWeight: 700 }}>돌아가기</button>
          <button onClick={handleComplete} style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none', background: '#DF6437', color: '#fff', fontWeight: 700 }}>완료하기</button>
        </div>
      </div>
    </ChoresLayout>
  );
}
