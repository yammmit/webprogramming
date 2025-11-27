import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance, { USE_MOCK } from "../../api/axiosInstance";
import { db } from "../../mocks/db";
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // Try network first
      if (!USE_MOCK) {
        try {
          const res = await axiosInstance.get(`/tasks/${taskId}`);
          const t = res.data;
          setTask(t);

          // try to load history
          if (t.status !== 'completed') {
            try {
              const h = await axiosInstance.get(`/tasks/${taskId}/history`);
              setHistory(h.data);
            } catch (e) {
              // ignore, fallback to mock
            }
          } else {
            // hide history for completed tasks
            setHistory([]);
          }

          // try to load evaluations for this task (network)
          try {
            const ev = await axiosInstance.get(`/tasks/${taskId}/evaluations`);
            setTaskEvaluations(ev.data);
          } catch (e) {
            // ignore, will fallback to mock later
          }

          setLoading(false);
          return;
        } catch (e) {
          console.warn("TaskDetail network fetch failed, falling back to mock", e?.message || e);
          // fallthrough to mock
        }
      }

      // Mock fallback using in-memory db
      try {
        const t = db.tasks.find((x) => String(x.task_id) === String(taskId));
        setTask(t || null);

        let histories = [];
        if (t && t.status !== 'completed') {
          // find histories for the whole group (all tasks in the same group), enrich with user and task title
          const groupId = t?.group_id;
          const groupTaskIds = db.tasks.filter((tt) => tt.group_id === groupId).map((tt) => tt.task_id);

          histories = db.taskHistory
            .filter((h) => groupTaskIds.includes(h.task_id))
            .map((h) => {
              const user = db.users.find((u) => u.user_id === h.completed_by) || { user_name: '알수없음' };
              const taskItem = db.tasks.find((td) => td.task_id === h.task_id) || { title: '' };
              return {
                ...h,
                user_name: user.user_name,
                assignment_id: h.assignment_id,
                task_title: taskItem.title,
              };
            })
            .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
        }

        // gather evaluations for this task by finding assignment ids in taskHistory
        const assignmentIds = db.taskHistory.filter(h => h.task_id === Number(taskId)).map(h => h.assignment_id);
        const evals = db.evaluations.filter(ev => assignmentIds.includes(ev.assignment_id));

        setHistory(histories);
        setTaskEvaluations(evals);
      } catch (e) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [taskId]);

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
            />        </div>

        {/* sheet */}
        <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', marginTop: -32, padding: 20, boxShadow: '0 -8px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 48, height: 6, background: '#e6e6e6', borderRadius: 4, margin: '0 auto 12px' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{task.title}</div>
              <div style={{ marginTop: 8 }}>
                <StarRating value={task.difficulty} editable={false} />
              </div>
            </div>

            <div style={{ width: 80 }}>
              {/* placeholder for right-side, e.g. avatar or action */}
            </div>
          </div>

          <p style={{ marginTop: 12, color: '#555' }}>{task.description || '설명이 없습니다.'}</p>

          {history.length > 0 && (
            <>
              <h4 style={{ marginTop: 20, marginBottom: 8, fontWeight: 800, textAlign: 'left' }}>지난 기록</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map((h) => (
                  <CompletionItem key={h.task_completion_id || `${h.assignment_id}-${h.task_id}`} record={h} />
                ))}
              </div>
            </>
          )}

          {/* 동료평가: show evaluations for this task (if any) when viewing a completed task */}
          {task.status === 'completed' && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>동료평가</div>
              {taskEvaluations.length === 0 ? (
                <p style={{ color: '#888' }}>아직 동료평가가 없습니다.</p>
              ) : (
                <TaskEvaluation evaluations={taskEvaluations} />
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button onClick={() => navigate(-1)} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #DF6437', background: '#fff', color: '#DF6437', fontWeight: 700 }}>돌아가기</button>
            {task?.status !== 'completed' && (
              <button onClick={() => alert('완료 처리 (모킹)')} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', background: '#DF6437', color: '#fff', fontWeight: 700 }}>완료하기</button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
