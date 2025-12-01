import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import StarRating from '../../components/ui/StarRating';
import api from '../../api/axiosInstance';
import Vcharacter from "../../assets/images/Vaccum_Character.png";

export default function AssignedRequest() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/tasks/${taskId}`);
        const t = res.data?.task || res.data;
        if (!cancelled) setTask(t || null);
      } catch (err) {
        console.error('Failed to load task from backend', err?.message || err);
        if (!cancelled) setTask(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [taskId]);

  if (loading) return <MainLayout>불러오는 중...</MainLayout>;
  if (!task) return <MainLayout>해당 집안일을 찾을 수 없습니다.</MainLayout>;

  // determine assignment info from backend-provided assignments (latest first)
  const latestAssignment = task?.assignments?.length ? task.assignments[0] : null;
  const isAssigned = !!latestAssignment && latestAssignment.status === 'assigned';
  const assignedUser = latestAssignment?.assignedTo || null;

  async function applyAssignment() {
    const storedRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let user = null;
    try { if (storedRaw) user = JSON.parse(storedRaw); } catch (e) { }
    const currentUserId = (user && user.user_id) || (typeof window !== 'undefined' && Number(localStorage.getItem('user_id')));

    try {
      const res = await api.post(`/tasks/${taskId}/assign`, { assignment_type: 'self-request', user_id: Number(currentUserId) });
      if (res.status === 201 || res.status === 200) {
        navigate(`/main/chores/${task.group_id}`);
      } else {
        alert('배정에 실패했습니다');
      }
    } catch (e) {
      console.error('assign error', e);
      alert(e.response?.data?.error || '배정 실패');
    }
  }

  return (
    <MainLayout>
      <div style={{ padding: 0 }}>
        <div style={{ background: '#DF6437', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={Vcharacter}
            alt="Vcharacter"
            style={{ width: '100%', height: '100%', objectFit: "contain", filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.18))' }}
          />        </div>

        <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', marginTop: -32, padding: 20, boxShadow: '0 -8px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 48, height: 6, background: '#e6e6e6', borderRadius: 4, margin: '0 auto 12px' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{task.title}</div>
              <div style={{ marginTop: 8 }}>
                <StarRating value={task.difficulty} editable={false} />
              </div>
              {isAssigned && (
                <div style={{ marginTop: 8, color: '#666', fontSize: 14 }}>배정자: {assignedUser ? assignedUser.user_name : '알 수 없음'}</div>
              )}
            </div>

            <div style={{ width: 80 }} />
          </div>

          <p style={{ marginTop: 12, color: '#555' }}>{task.description || '설명이 없습니다.'}</p>

          {/* no history shown for assigned request */}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button onClick={() => navigate(-1)} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #DF6437', background: '#fff', color: '#DF6437', fontWeight: 700 }}>돌아가기</button>
            {!isAssigned && (
              <button onClick={() => setShowConfirm(true)} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', background: '#DF6437', color: '#fff', fontWeight: 700 }}>배정신청</button>
            )}
          </div>
        </div>
      </div>
      {/* confirmation modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', zIndex: 3000 }}>
          <div style={{ width: 320, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{task.title}</div>
              <div style={{ color: '#333' }}>{task.title}를{''} 배정 신청하시겠어요?</div>
            </div>
            <div style={{ display: 'flex', borderTop: '1px solid #eee' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: 14, background: '#fff', border: 'none', fontSize: 16 }}>취소</button>
              <div style={{ width: 1, background: '#eee' }} />
              <button onClick={() => { applyAssignment(); setShowConfirm(false); }} style={{ flex: 1, padding: 14, background: '#fff', border: 'none', color: '#DF6437', fontSize: 16, fontWeight: 700 }}>신청</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
