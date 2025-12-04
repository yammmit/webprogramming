import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ChoresLayout from '../../components/layout/ChoresLayout';
import StarRating from '../../components/ui/StarRating';
import { db } from '../../mocks/db';
import axiosInstance from '../../api/axiosInstance';

export default function ReviewChore() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get(`/tasks/${taskId}`);
        const t = res.data?.task || res.data;
        if (!cancelled) setTask(t || null);
      } catch (e) {
        console.warn('Failed to load task from backend, falling back to mock', e?.message || e);
        // fallback to mock
        try {
          const t = db.tasks.find((x) => String(x.task_id) === String(taskId));
          if (!cancelled) setTask(t || null);
        } catch (err) {
          if (!cancelled) setError(err?.message || String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [taskId]);

  // resolve current user id from localStorage
  let storedUserLocal = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('user');
      if (raw) storedUserLocal = JSON.parse(raw);
    } catch (e) {}
  }
  const currentUserId = (storedUserLocal && storedUserLocal.user_id) || (typeof window !== 'undefined' && Number(localStorage.getItem('user_id')));

  const assignedUser = (task && task.assigned_to != null) ? db.users.find(u => u.user_id === task.assigned_to) : null;

  if (loading) return <ChoresLayout>불러오는 중...</ChoresLayout>;
  if (error) return <ChoresLayout>에러: {String(error)}</ChoresLayout>;
  if (!task) return <ChoresLayout>집안일을 찾을 수 없습니다.</ChoresLayout>;

  async function handleComplete() {
    if (!rating || rating < 1) return alert('별점을 선택하세요.');

    try {
      const body = {
        rating: Number(rating),
        comment: comment.trim() || null,
        is_anonymous: !!isAnonymous,
      };
      const res = await axiosInstance.post(`/tasks/${taskId}/evaluations`, body);
      if (res.status === 201 || res.status === 200) {
        alert('평가가 등록되었습니다.');
        navigate(-1);
      } else {
        alert(res.data?.error || '평가 등록에 실패했습니다.');
      }
    } catch (e) {
      console.error('create evaluation failed', e);
      alert(e.response?.data?.error || '평가 등록 중 오류가 발생했습니다');
    }
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
