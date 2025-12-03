import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import StarRating from '../../components/ui/StarRating';
import api from '../../api/axiosInstance';
import Vcharacter from "../../assets/images/Vaccum_Character.png";
import LadderResultModal from '../../components/ui/LadderResultModal';

export default function AssignedRequest() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [votes, setVotes] = useState(null);
  const [required, setRequired] = useState(null);
  const [totalMembers, setTotalMembers] = useState(null);
  const [voting, setVoting] = useState(false);
  const [showLadderResult, setShowLadderResult] = useState(false);
  const [ladderResult, setLadderResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/tasks/${taskId}`);
        const t = res.data?.task || res.data;
        if (!cancelled) setTask(t || null);
        // fetch ladder status alongside task
        try {
          const st = await api.get(`/tasks/${taskId}/ladder/status`);
          const data = st.data || {};
          if (!cancelled) {
            setVotes(Number(data.votes ?? data.votes ?? 0));
            setRequired(Number(data.required ?? Math.ceil((data.total_members||0)/2)));
            setTotalMembers(Number(data.total_members ?? data.totalMembers ?? 0));
          }
        } catch (e) {
          // ignore if endpoint missing
        }
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

  async function fetchLadderStatus() {
    try {
      const st = await api.get(`/tasks/${taskId}/ladder/status`);
      const data = st.data || {};
      setVotes(Number(data.votes ?? 0));
      setRequired(Number(data.required ?? Math.ceil((data.total_members||0)/2)));
      setTotalMembers(Number(data.total_members ?? data.totalMembers ?? 0));
      return data;
    } catch (e) {
      return null;
    }
  }

  async function handleVote() {
    // debug: expose helper and log invocation
    if (typeof window !== 'undefined') {
      window.__testVote = async () => { try { await handleVote(); } catch (e) { /* ignore */ } };
      console.log('handleVote called', { taskId, voting });
    }
    // fetch ladder status first to update local vote/total state.
    // Show preview modal only if majority is already reached (pre-existing), otherwise don't open modal yet.
    try {
      const st = await fetchLadderStatus();
      if (st) {
        const membersCount = Number(st.total_members ?? st.totalMembers ?? totalMembers ?? task?.group?.members?.length ?? 0);
        // if majority already true, show preview (edge case where threshold was met before this user)
        const hasMajority = Boolean(st.majority || (Number(st.votes || 0) >= Math.ceil(membersCount / 2)));
        console.log('Ladder status fetched', { st, membersCount, hasMajority });
        if (hasMajority) {
          const preview = {
            taskId: Number(taskId),
            total_members: membersCount,
            winner: null,
            status: 'preview',
          };
          setLadderResult(preview);
          setShowLadderResult(true);
        }
      }
    } catch (e) {
      // ignore preview errors
      console.warn('failed to fetch ladder status for preview', e);
    }
    // if task already assigned, show ladder result modal instead of voting
    const currentLatest = task?.assignments?.length ? task.assignments[0] : null;
    if (currentLatest && currentLatest.status === 'assigned') {
      const assigned = currentLatest;
      const result = {
        taskId: Number(taskId),
        status: 'assigned',
        total_members: totalMembers || task?.group?.members?.length || null,
        winner: {
          user_id: assigned.assigned_to || assigned.assignedTo?.user_id || null,
          user_name: assigned.assignedTo?.user_name || assigned.assignedTo?.name || null,
        },
        assignment_id: assigned.task_assignment_id || null,
      };
      console.log('Showing existing assignment result', result);
      setLadderResult(result);
      setShowLadderResult(true);
      return;
    }
    if (voting) return;
    setVoting(true);
    try {
      let res;
      try {
        // build absolute URL (use instance baseURL if present)
        const base = api?.defaults?.baseURL || 'http://localhost:3000';
        const voteUrl = `${base.replace(/\/$/, '')}/tasks/${taskId}/ladder/vote`;
        // prefer access_token or idToken stored by app
        const token = typeof window !== 'undefined' && (localStorage.getItem('access_token') || localStorage.getItem('idToken') || localStorage.getItem('token')) || null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        console.log('About to call API (absolute)', { voteUrl, headers });
        res = await api.post(voteUrl, { vote: true }, { headers });
        console.log('API call finished', { status: res?.status, data: res?.data });
      } catch (err) {
        console.error('API post error (ladder/vote)', err?.message, err);
        if (err?.response?.status === 404) {
          console.log('Falling back to legacy /vote endpoint');
          try {
            const base = api?.defaults?.baseURL || 'http://localhost:3000';
            const legacyUrl = `${base.replace(/\/$/, '')}/tasks/${taskId}/vote`;
            const token = typeof window !== 'undefined' && (localStorage.getItem('access_token') || localStorage.getItem('idToken') || localStorage.getItem('token')) || null;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            res = await api.post(legacyUrl, { vote: true }, { headers });
            console.log('Fallback API call finished', { status: res?.status, data: res?.data });
          } catch (err2) {
            console.error('Fallback /vote error', err2?.message, err2);
            throw err2;
          }
        } else {
          throw err;
        }
      }
      const data = res.data || {};
      console.log('Vote response data', data);
      setVotes(Number(data.votes ?? data.votes ?? 0));
      setRequired(Number(data.required ?? Math.ceil((data.total_members||0)/2)));
      // refetch total_members if not provided
      if (typeof data.required === 'undefined') {
        const st = await fetchLadderStatus();
        if (st) {
          setTotalMembers(Number(st.total_members ?? st.totalMembers ?? 0));
        }
      }

      const majority = Boolean(data.majority || (Number(data.votes || 0) >= Math.ceil((Number(data.total_members||totalMembers||0))/2)));
      if (majority) {
        // auto run assignment
        try {
          let run;
          try {
            run = await api.post(`/tasks/${taskId}/ladder/assign`);
          } catch (err) {
            if (err?.response?.status === 404) {
              // try legacy endpoints
              try { run = await api.post(`/tasks/${taskId}/ladder-run`); } catch (e2) { run = await api.post(`/tasks/${taskId}/assign`); }
            } else {
              throw err;
            }
          }
          const result = run.data || {};
          // ensure total_members exists on result for consistent rendering
          if (typeof result.total_members === 'undefined') {
            result.total_members = totalMembers || task?.group?.members?.length || null;
          }
          console.log('Ladder assign result', result);
          // show result modal instead of navigating
          setLadderResult(result);
          setShowLadderResult(true);
          return;
        } catch (e) {
          console.error('ladder assign failed', e);
          alert(e.response?.data?.error || '사다리 실행에 실패했습니다');
        }
      }
    } catch (e) {
      console.error('vote error', { message: e?.message, response: e?.response, stack: e?.stack });
      alert(e?.response?.data?.error || e?.message || '투표 실패');
    } finally {
      setVoting(false);
    }
  }

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

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 12 }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 800, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <StarRating value={Number(task.difficulty) || 0} editable={false} />
                </div>
              </div>

              {isAssigned && (
                <div style={{ marginTop: 8, color: '#666', textAlign: 'left',fontSize: 14 }}>배정자: {assignedUser ? assignedUser.user_name : '알 수 없음'}</div>
              )}
            </div>
          </div>

          <p style={{ marginTop: 12, color: '#555', textAlign: 'left' }}>{task.description || '설명이 없습니다.'}</p>

          {/* no history shown for assigned request */}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button onClick={() => navigate(-1)} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #DF6437', background: '#fff', color: '#DF6437', fontWeight: 700 }}>돌아가기</button>
            { !isAssigned && (
              <button onClick={() => setShowConfirm(true)} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', background: '#DF6437', color: '#fff', fontWeight: 700 }}>배정신청</button>
            )}
            <button onClick={handleVote} disabled={voting} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #DF6437', background: '#fff', color: '#DF6437', fontWeight: 700 }}>
              {votes !== null ? `사다리 (${votes}/${totalMembers ?? '-'})` : '사다리 참여'}
            </button>
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
      <LadderResultModal
        visible={showLadderResult}
        result={ladderResult}
        onClose={() => setShowLadderResult(false)}
        onViewTask={() => { setShowLadderResult(false); navigate(`/main/tasks/${taskId}`); }}
      />
    </MainLayout>
  );
}
