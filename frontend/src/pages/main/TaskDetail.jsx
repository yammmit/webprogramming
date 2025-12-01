import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import MainLayout from "../../components/layout/MainLayout";
import StarRating from "../../components/ui/StarRating";
import CompletionItem from '../../components/ui/TaskDone';
import TaskEvaluation from '../../components/ui/TaskEvaluation';
import Vcharacter from "../../assets/images/Vaccum_Character.png";


export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskEvaluations, setTaskEvaluations] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // resolve current user id from localStorage
  let storedUserLocal = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('user');
      if (raw) storedUserLocal = JSON.parse(raw);
    } catch (e) {}
  }
  const currentUserId = (storedUserLocal && storedUserLocal.user_id) || (typeof window !== 'undefined' && Number(localStorage.getItem('user_id')));

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await axiosInstance.get(`/tasks/${taskId}`);
        console.log('GET /tasks/:id response', res.data);
        const t = res.data?.task || res.data;
        setTask(t || null);

        // try to load history endpoint if available
        try {
          const groupId = t.group_id;
          if (groupId) {
            const gh = await axiosInstance.get(`/groups/${groupId}/history?limit=5`);
            console.log('GET /groups/:id/history response', gh.data);
            setHistory(Array.isArray(gh.data) ? gh.data : []);
          } else {
            setHistory([]);
          }
        } catch (e) {
          setHistory([]);
        }

        // load evaluations
        try {
          const ev = await axiosInstance.get(`/tasks/${taskId}/evaluations`);
          console.log('GET /tasks/:id/evaluations response', ev.data);
          const evdata = ev.data?.data || ev.data;
          setTaskEvaluations(Array.isArray(evdata) ? evdata : []);
        } catch (e) {
          setTaskEvaluations([]);
        }
      } catch (e) {
        console.error("TaskDetail network fetch failed", e?.message || e);
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [taskId]);

  // compute average rating for evaluations
  const avgRating = (Array.isArray(taskEvaluations) && taskEvaluations.length > 0)
    ? (taskEvaluations.reduce((s, e) => s + (Number(e.rating) || 0), 0) / taskEvaluations.length)
    : null;

  if (loading) return <MainLayout>불러오는 중...</MainLayout>;
  if (error) return <MainLayout>에러: {String(error)}</MainLayout>;
  if (!task) return <MainLayout>해당 집안일을 찾을 수 없습니다.</MainLayout>;

  return (
    <MainLayout>
      <div style={{ padding: 0 }}>
        {/* top banner */}
        <div style={{ background: '#DF6437', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={Vcharacter}
            alt="Vcharacter"
            style={{ width: '100%', height: '100%', objectFit: "contain", filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.18))' }}
          />
        </div>

        {/* sheet */}
        <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', marginTop: -32, padding: 20, boxShadow: '0 -8px 30px rgba(0,0,0,0.06)', position: 'relative', paddingBottom: 160, display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 48, height: 6, background: '#e6e6e6', borderRadius: 4, margin: '0 auto 12px' }} />

          {/* scrollable content area */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{task.title}</div>
                <div style={{ marginTop: 8 }}>
                  <StarRating value={task.difficulty} editable={false} />
                </div>
              </div>

              <div style={{ width: 80 }} />
            </div>

            <p style={{ marginTop: 12, color: '#555', textAlign: 'left', width: '100%' }}>{task.description || '설명이 없습니다.'}</p>

            {task.status !== 'completed' && (
              <>
                <h4 style={{ marginTop: 20, marginBottom: 8, fontWeight: 800, textAlign: 'left' }}>지난 기록</h4>

                {/* header row for the history list (tighter spacing) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 8 }}>
                  <div style={{ flex: '0 0 90px', fontSize: 12, color: '#666', fontWeight: 700 }}>배정자</div>
                  <div style={{ flex: '1 1 auto', fontSize: 13, color: '#666', fontWeight: 700, paddingLeft: 8 }}>집안일</div>
                  <div style={{ flex: '0 0 100px', fontSize: 12, color: '#666', fontWeight: 700, textAlign: 'right' }}>완료 날짜</div>
                  <div style={{ flex: '0 0 72px', fontSize: 12, color: '#666', fontWeight: 700, textAlign: 'right' }}>난이도</div>
                </div>

                {history.length === 0 ? (
                  <div style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    아직 기록이 없습니다.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {history.map((h) => {
                      const rawName = h.user_name || h.completed_by || '알수없음';
                      const assignedName = (String(rawName).length > 5) ? (String(rawName).slice(0,5) + '...') : rawName;
                      const rawTitle = h.task_title || h.title || '';
                      const title = (String(rawTitle).length > 10) ? (String(rawTitle).slice(0,10) + '...') : rawTitle;
                      // format yyyy/mm/dd
                      let completedAt = '';
                      if (h.completed_at) {
                        const d = new Date(h.completed_at);
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        completedAt = `${yyyy}/${mm}/${dd}`;
                      }
                      const difficulty = Number(h?.assignment?.task?.difficulty ?? h.difficulty ?? 0) || 0;
                      return (
                        <div key={h.task_completion_id || `${h.assignment_id}-${h.task_id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: 8, background: '#fff', border: '1px solid #f5f5f5' }}>
                          <div style={{ flex: '0 0 90px', fontSize: 13, color: '#333' }}>{assignedName}</div>
                          <div style={{ flex: '1 1 auto', fontSize: 13, color: '#111', fontWeight: 700, paddingLeft: 8 }}>{title}</div>
                          <div style={{ flex: '0 0 100px', fontSize: 12, color: '#666', textAlign: 'right' }}>{completedAt}</div>
                          <div style={{ flex: '0 0 72px', textAlign: 'right' }}>
                            <span style={{ fontSize: 14, lineHeight: 1 }}>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} style={{ display: 'inline-block', width: 12, textAlign: 'center', color: i < difficulty ? '#DF6437' : '#E0E0E0' }}>★</span>
                              ))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* 동료평가: show evaluations for this task (if any) when viewing a completed task */}
            {task.status === 'completed' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8, fontWeight: 700, marginBottom: 8 }}>
                  <div>동료평가{avgRating !== null ? ` (${avgRating.toFixed(2)})` : ''}</div>
                </div>
                {taskEvaluations.length === 0 ? (
                  <p style={{ color: '#888' }}>아직 동료평가가 없습니다.</p>
                ) : (
                  <TaskEvaluation evaluations={taskEvaluations} />
                )}
              </div>
            )}
          </div>

          {/* action footer - sits above bottom navbar */}
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18, display: 'flex', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #DF6437', background: '#fff', color: '#DF6437', fontWeight: 700 }}>돌아가기</button>
            {task?.status !== 'completed' && (
              <button onClick={() => setShowConfirm(true)} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', background: '#DF6437', color: '#fff', fontWeight: 700 }}>완료하기</button>
            )}
          </div>

          {/* Confirm modal */}
          {showConfirm && (
            <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', zIndex: 1200 }}>
              <div style={{ width: '90%', maxWidth: 420, background: '#fff', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>정말 완료하시겠어요?</div>
                <div style={{ color: '#666', marginBottom: 16 }}>집안일을 완료 처리하면 작업이 완료 상태로 변경됩니다.</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowConfirm(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#fff' }}>취소</button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await axiosInstance.post(`/tasks/${taskId}/complete`);
                        if (res.status === 201 || res.status === 200) {
                          setTask(prev => ({ ...prev, status: 'completed' }));
                          setHistory([]);
                          setShowConfirm(false);
                          setShowShare(true);
                        } else {
                          console.error('complete task failed', res.data);
                          alert('완료 처리에 실패했습니다.');
                          setShowConfirm(false);
                        }
                      } catch (e) {
                        console.error('complete failed', e);
                        alert(e.response?.data?.error || '완료 처리 중 오류가 발생했습니다');
                        setShowConfirm(false);
                      }
                    }}
                    style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#DF6437', color: '#fff' }}
                  >
                    완료
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
