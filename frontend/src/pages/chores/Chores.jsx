// src/pages/main/Dashboard.jsx
import { useEffect, useState } from "react";
import { fetchMyGroups } from "../../api/groups";
import { fetchTasksByGroup } from "../../api/tasks";
import character from "../../assets/images/splash-character.png";
import Vcharacter from "../../assets/images/Vaccum_Character.png";
import StarRating from "../../components/ui/StarRating";
import { fetchUsersByIds } from '../../api/users';

import MainLayout from "../../components/layout/MainLayout";
import Card from "../../components/ui/Card";
import { useParams, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [assignedNames, setAssignedNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('unassigned');

  // keep assignedNames in sync when tasks change
  useEffect(() => {
    let cancelled = false;
    async function loadAssignedNames() {
      try {
        const ids = Array.from(new Set((tasks || [])
          .filter(t => t.assigned_to != null)
          .map(t => Number(t.assigned_to)).filter(n => !Number.isNaN(n))));
        if (ids.length === 0) { if (!cancelled) setAssignedNames({}); return; }
        const users = await fetchUsersByIds(ids);
        const map = {};
        users.forEach(u => { map[u.user_id] = u.user_name || u.name || String(u.user_id); });
        if (!cancelled) setAssignedNames(map);
      } catch (e) {
        console.warn('Failed to load assigned user names', e?.message || e);
      }
    }
    loadAssignedNames();
    return () => { cancelled = true; };
  }, [tasks]);

  // Resolve logged-in user's name robustly from localStorage or group data
  let storedUser = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('user');
      if (raw) storedUser = JSON.parse(raw);
    } catch (e) {
      // ignore JSON parse errors
    }
  }

  const user_name =
    (storedUser && (storedUser.user_name || storedUser.name)) ||
    (typeof window !== 'undefined' && localStorage.getItem('user_name')) ||
    group?.user_name ||
    group?.group_name ||
    '사용자이름이 출력되지않습니다';

  useEffect(() => {
    loadDashboard();

    // listen for Settings changes (other tabs/components writing currentGroupId)
    function onStorage(e) {
      if (e.key === 'currentGroupId' || e.key === 'group_id') {
        loadDashboard();
      }
    }
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
  }, []);

  // re-run when route groupId changes
  useEffect(() => {
    loadDashboard();
  }, [groupId]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const groups = await fetchMyGroups();

      if (groups.length === 0) {
        setGroup(null);
        setTasks([]);
        setLoading(false);
        return;
      }

      // selected group must come from Settings (localStorage.currentGroupId)
      const storedGroupId = (typeof window !== 'undefined') ? (localStorage.getItem('currentGroupId') || localStorage.getItem('group_id')) : null;

      if (!storedGroupId) {
        setGroup(null);
        setTasks([]);
        setLoading(false);
        return;
      }

      const selectedGroup = groups.find((g) => String(g.group_id) === String(storedGroupId));

      if (!selectedGroup) {
        setGroup(null);
        setTasks([]);
        setLoading(false);
        return;
      }

      setGroup(selectedGroup);

      const taskList = await fetchTasksByGroup(selectedGroup.group_id);
      setTasks(taskList || []);
    } catch (e) {
      console.error("대시보드 로딩 실패:", e);
      // Hint for developer: likely the backend (http://localhost:3000) is not running
      if (e?.code === "ERR_NETWORK" || e?.message?.includes("Network Error")) {
        console.warn(
          "Network error contacting API. Is the backend server running at http://localhost:3000 ?"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <MainLayout>불러오는 중...</MainLayout>;

  // determine current user id from localStorage or parsed storedUser (kept for other logic)
  // normalize various possible shapes for user id
  const currentUserId = (() => {
    if (storedUser) {
      const cand = storedUser.user_id ?? storedUser.userId ?? storedUser.id ?? storedUser.uid ?? storedUser._id;
      if (cand != null && cand !== '') return Number(cand);
    }
    if (typeof window !== 'undefined') {
      const ls = localStorage.getItem('user_id') ?? localStorage.getItem('userId') ?? localStorage.getItem('id');
      if (ls != null && ls !== '') return Number(ls);
    }
    return null;
  })();

  // tasks were loaded for the selected group, use tasks directly
  const groupTasks = tasks;

  // Assigned but not completed tasks (assigned to someone)
  const inProgress = groupTasks.filter((t) => t.assigned_to != null && t.status !== 'completed');

  // Unassigned tasks (available to be picked)
  const unassigned = groupTasks.filter((t) => t.assigned_to == null);

  // tasks that are completed and not yet reviewed by current user
  let toReview = [];
  if (currentUserId != null && !Number.isNaN(currentUserId)) {
    const me = String(currentUserId);
    toReview = groupTasks.filter((t) => {
      // only completed tasks
      if (String(t.status || '').toLowerCase() !== 'completed') return false;

      // exclude tasks assigned to me
      if (String(t.assigned_to) === me) return false;

      // check reviews stored on the task object (backend-provided)
      const hasReviewedOnTask = Array.isArray(t.reviews) && t.reviews.some((r) => {
        const ridUser = String(r.user_id ?? r.userId ?? r.user ?? '');
        return ridUser === me;
      });
      return !hasReviewedOnTask;
    });
  } else {
    // cannot determine current user -> no reviewable items
    toReview = [];
  }


  // banner counts (reflect selected tab, including review)
  const headerCount = selectedTab === 'unassigned' ? unassigned.length : (selectedTab === 'assigned' ? inProgress.length : (selectedTab === 'review' ? toReview.length : 0));
  const groupPrefix = group?.group_name ? `${group.group_name}방에 ` : '';
  const headerLabel = selectedTab === 'unassigned'
    ? `${groupPrefix}미배정된 집안일이`
    : (selectedTab === 'assigned'
      ? `${groupPrefix}진행중인 집안일이`
      : (selectedTab === 'review' ? `${groupPrefix}리뷰가 필요한 집안일이` : `${groupPrefix}집안일이`));

  return (
    <MainLayout>
      <div style={{ padding: "20px", position: 'relative' }}>
        {/* 상단 환영 메시지 (캐릭터 포함 UI는 이후 디자인 반영 가능) */}
        <section
          style={{
            marginBottom: "24px",
            background: "#DF6437",
            color: "#fff",
            padding: "22px 18px",
            borderRadius: "0 0 20px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            boxShadow: "0 6px 18px rgba(223,100,55,0.12)",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 18, lineHeight: 1.2 }}>
                <div style={{ opacity: 0.95 }}>{headerLabel}</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{headerCount}건 있어요.</div>
              </div>
            </div>

            <div style={{ width: 100, height: 100, flex: '0 0 100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={Vcharacter}
                alt="Vcharacter"
                style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.18))' }}
              />
            </div>
          </div>
        </section>
          
        {/* 배정 / 미배정 탭 버튼 */}
        <section style={{ marginBottom: "24px" }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <button onClick={() => setSelectedTab('unassigned')} style={{ padding: '8px 18px', borderRadius: 20, border: '1px solid #DFDFDF', background: selectedTab === 'unassigned' ? '#fff' : 'transparent' }}>미배정</button>
            <button onClick={() => setSelectedTab('assigned')} style={{ padding: '8px 18px', borderRadius: 20, border: '1px solid #DFDFDF', background: selectedTab === 'assigned' ? '#fff' : 'transparent' }}>배정</button>
            <button onClick={() => setSelectedTab('review')} style={{ padding: '8px 18px', borderRadius: 20, border: '1px solid #DFDFDF', background: selectedTab === 'review' ? '#fff' : 'transparent' }}>리뷰</button>
          </div>

          {/* Render lists per selected tab explicitly to avoid showing multiple lists */}
          {selectedTab === 'unassigned' && (
            (unassigned.length === 0) ? (
              <div style={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                미배정된 집안일이 없어요
              </div>
            ) : (
              <HorizontalTaskRow tasks={unassigned} assignedNames={assignedNames} />
            )
          )}

          {selectedTab === 'assigned' && (
            (inProgress.length === 0) ? (
              <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                배정된 집안일이 없어요
              </div>
            ) : (
              <HorizontalTaskRow tasks={inProgress} assignedNames={assignedNames} />
            )
          )}

          {selectedTab === 'review' && (
            (toReview.length === 0) ? (
              <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                평가할 항목이 없습니다
              </div>
            ) : (
              <HorizontalTaskRow tasks={toReview} cardBase={'/chores/review'} assignedNames={assignedNames} />
            )
          )}
        </section>
        
        {/* floating create button (positioned inside content) */}
        <div style={{ position: 'absolute', right: 20, bottom: -300, zIndex: 800 }}>
          <button
            onClick={() => navigate('/chores/create')}
            aria-label="새 집안일 등록"
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#DF6437',
              border: 'none',
              color: '#fff',
              fontSize: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(223,100,55,0.28)',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        </div>
       </div>
     </MainLayout>
   );
 }

/* ---------------------------------------------
    Task 리스트 렌더링 분리 (Card 컴포넌트 활용)
--------------------------------------------- */

function TaskList({ tasks }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "12px",
      }}
    >
      {tasks.map((task) => (
        <Card key={task.task_id} to={`/main/tasks/${task.task_id}`} bare>
          <div style={{ position: "relative" }}>
            <div
              style={{
                background: "#EEF0F1",
                borderRadius: 12,
                padding: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 140,
                boxSizing: "border-box",
              }}
            >
              <img src={character} alt="character" style={{ width: "80%", height: "100%", objectFit: "contain" }} />
            </div>

            <div style={{
              position: 'relative',
              marginTop: -22,
              background: '#F5F5F5',
              borderRadius: '0 0 12px 12px',
              padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                <StarRating value={task.difficulty} editable={false} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', color: '#111' }}>{task.title}</div>
            </div>

            {/* simple overlays to avoid heavy inline SVG and keep JSX balanced */}
            {task.status === 'completed' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 12,
                background: 'rgba(69,75,76,0.79)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 20,
                fontWeight: 800,
                pointerEvents: 'none'
              }}>
                완료
              </div>
            )}

            {task.status === 'assigned' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 12,
                background: 'rgba(69,75,76,0.5)'
              }} />
            )}

          </div>
        </Card>
      ))}
    </div>
  );
}
