// src/pages/main/Dashboard.jsx
import { useEffect, useState } from "react";
import { fetchMyGroups } from "../../api/groups";
import { fetchTasksByGroup } from "../../api/tasks";
import character from "../../assets/images/splash-character.png";
import Vcharacter from "../../assets/images/Vaccum_Character.png";
import StarRating from "../../components/ui/StarRating";

import MainLayout from "../../components/layout/MainLayout";
import Card from "../../components/ui/Card";

export default function Dashboard() {
  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // determine current user id from localStorage or parsed storedUser
  const currentUserId = (() => {
    if (storedUser && storedUser.user_id) return Number(storedUser.user_id);
    if (typeof window !== 'undefined') {
      const ls = localStorage.getItem('user_id') || localStorage.getItem('userId') || null;
      if (ls) return Number(ls);
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const p = JSON.parse(raw);
          if (p?.user_id) return Number(p.user_id);
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  })();

  const user_name =
    (storedUser && (storedUser.user_name || storedUser.name)) ||
    (typeof window !== 'undefined' && localStorage.getItem('user_name')) ||
    group?.user_name ||
    group?.group_name ||
    '사용자이름이 출력되지않습니다';

  useEffect(() => {
    loadDashboard();

    function onStorage(e) {
      if (e.key === 'currentGroupId' || e.key === 'group_id') {
        loadDashboard();
      }
    }
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const groups = await fetchMyGroups();
      if (!Array.isArray(groups) || groups.length === 0) {
        setTasks([]);
        setGroup(null);
        setLoading(false);
        return;
      }

      // determine selected group from localStorage
      const storedGroupId = (typeof window !== 'undefined') ? (localStorage.getItem('currentGroupId') || localStorage.getItem('group_id')) : null;
      if (!storedGroupId) {
        // no selected group -> show nothing
        setTasks([]);
        setGroup(null);
        setLoading(false);
        return;
      }

      const selectedGroup = groups.find((g) => String(g.group_id) === String(storedGroupId));
      if (!selectedGroup) {
        setTasks([]);
        setGroup(null);
        setLoading(false);
        return;
      }

      setGroup(selectedGroup);
      const taskList = await fetchTasksByGroup(selectedGroup.group_id);
      console.log('Dashboard loaded tasks for group', selectedGroup.group_id, taskList);
      setTasks((taskList || []).map(t => ({ ...t, group_name: selectedGroup.group_name })));
    } catch (e) {
      console.error("대시보드 로딩 실패:", e);
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

  // If no group selected and no tasks, show message
  // (but dashboard now aggregates across all groups; if tasks empty we show empty lists below)
  
  // Only show tasks that are assigned to the current user across all groups
  const myTasks = tasks.filter((t) => Number(t.assigned_to) === Number(currentUserId));

  const inProgress = myTasks.filter((t) => t.status === "assigned");
  const completed = myTasks.filter((t) => t.status === "completed");

  return (
    <MainLayout>
      <div style={{ padding: "20px" }}>
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
          <div style={{ display: "flex", flexDirection: "column", maxWidth: "65%" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{user_name}님,</h2>
            <p style={{ marginTop: "8px", fontSize: "15px", color: "rgba(255,255,255,0.95)", marginBottom: 0 }}>
              모든 방의 집안일을 한 번에 확인해볼까요?
            </p>
          </div>

          <div style={{ width: 100, height: 100, flex: '0 0 100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={Vcharacter}
              alt="Vcharacter"
              style={{ width: '100%', height: '100%', objectFit: "contain", filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.18))' }}
            />
          </div>
        </section>

        {/* 진행중 작업 */}
        <section style={{ marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "12px",
              textAlign: "left",
            }}
          >
            진행 중
          </h3>

          {inProgress.length === 0 ? (
            <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              진행 중인 집안일이 없어요
            </div>
          ) : (
            <HorizontalTaskRow tasks={inProgress} />
          )}
        </section>

        {/* 완료 작업 */}
        <section>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "12px",
              textAlign: "left",
            }}
          >
            완료
          </h3>

          {completed.length === 0 ? (
            <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              아직 완료된 집안일이 없어요
            </div>
          ) : (
            <HorizontalTaskRow tasks={completed} />
          )}
        </section>
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
            {/* image area */}
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

            {/* footer overlaps image slightly */}
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
              {task.group_name && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 6, textAlign: 'center' }}>
                  {task.group_name} 방
                </div>
              )}
            </div>

            {/* completed full-bleed overlay */}
            {task.status === "completed" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 12,
                  background: "rgba(69,75,76,0.79)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: 12,
                  boxSizing: "border-box",
                }}
              >
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-20deg)', pointerEvents: 'none' }}>
                  <svg width="140" height="40" viewBox="0 0 119 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10.5L0.894748 1.50001L118.5 1.5L111 9.5L118.5 17.5L111 23L118.105 32H0.500003L8 24L0.500003 16L8 10.5Z" fill="#DF6437"/>
                    <path d="M49.7031 10.7969C51.7812 10.7969 53.2812 11.9688 53.2812 13.6875C53.2812 15.0781 52.2578 16.1406 50.7344 16.4688V17.5C51.8438 17.4375 52.9609 17.3359 54 17.1875L54.1562 18.6406C51.2344 19.1562 47.9688 19.2188 45.5938 19.2188L45.3906 17.6406C46.375 17.6406 47.5234 17.6328 48.7344 17.5938V16.4844C47.1641 16.1719 46.1094 15.1016 46.125 13.6875C46.1094 11.9688 47.6094 10.7969 49.7031 10.7969ZM49.7031 12.2969C48.6875 12.3125 47.9688 12.7969 47.9844 13.6875C47.9688 14.5469 48.6875 15.0625 49.7031 15.0625C50.7188 15.0625 51.4062 14.5469 51.4062 13.6875C51.4062 12.7969 50.7188 12.3125 49.7031 12.2969ZM56.7969 10.2344V14.7031H58.6094V16.3594H56.7969V21.0781H54.7969V10.2344H56.7969ZM57.2812 22.5781V24.1719H47.2656V20.125H49.2656V22.5781H57.2812ZM72.0896 21.2188V22.8594H59.074V21.2188H62.4021V19.0469H60.574V14.2656H68.6209V12.7344H60.5584V11.1406H70.5896V15.8594H62.574V17.4375H70.9178V19.0469H68.9021V21.2188H72.0896ZM64.3396 21.2188H66.949V19.0469H64.3396V21.2188Z" fill="white"/>
                  </svg>
                </div>
               </div>
             )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Horizontal row for in-progress tasks
function HorizontalTaskRow({ tasks }) {
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
      <div style={{ display: 'flex', gap: 12, width: 'max-content' }}>
        {tasks.map((task) => (
          <div key={task.task_id} style={{ minWidth: 220 }}>
            <Card bare to={`/main/tasks/${task.task_id}`}>
               <div style={{ position: 'relative' }}>
                <div style={{
                  background: '#D7DBDC',
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 140,
                  boxSizing: 'border-box'
                }}>
                  <img src={character} alt='character' style={{ width: '80%', height: '100%', objectFit: 'contain' }} />
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
                  {task.group_name && (
                    <div style={{ fontSize: 12, color: '#666', marginTop: 6, textAlign: 'center' }}>{task.group_name} 방</div>
                  )}
                </div>

                {/* completed full-bleed overlay */}
                {task.status === 'completed' && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 12,
                    background: 'rgba(69,75,76,0.79)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 12,
                    boxSizing: 'border-box'
                  }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-20deg)', pointerEvents: 'none' }}>
                    <svg width="140" height="40" viewBox="0 0 119 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 10.5L0.894748 1.50001L118.5 1.5L111 9.5L118.5 17.5L111 23L118.105 32H0.500003L8 24L0.500003 16L8 10.5Z" fill="#DF6437"/>
                      <path d="M49.7031 10.7969C51.7812 10.7969 53.2812 11.9688 53.2812 13.6875C53.2812 15.0781 52.2578 16.1406 50.7344 16.4688V17.5C51.8438 17.4375 52.9609 17.3359 54 17.1875L54.1562 18.6406C51.2344 19.1562 47.9688 19.2188 45.5938 19.2188L45.3906 17.6406C46.375 17.6406 47.5234 17.6328 48.7344 17.5938V16.4844C47.1641 16.1719 46.1094 15.1016 46.125 13.6875C46.1094 11.9688 47.6094 10.7969 49.7031 10.7969ZM49.7031 12.2969C48.6875 12.3125 47.9688 12.7969 47.9844 13.6875C47.9688 14.5469 48.6875 15.0625 49.7031 15.0625C50.7188 15.0625 51.4062 14.5469 51.4062 13.6875C51.4062 12.7969 50.7188 12.3125 49.7031 12.2969ZM56.7969 10.2344V14.7031H58.6094V16.3594H56.7969V21.0781H54.7969V10.2344H56.7969ZM57.2812 22.5781V24.1719H47.2656V20.125H49.2656V22.5781H57.2812ZM72.0896 21.2188V22.8594H59.074V21.2188H62.4021V19.0469H60.574V14.2656H68.6209V12.7344H60.5584V11.1406H70.5896V15.8594H62.574V17.4375H70.9178V19.0469H68.9021V21.2188H72.0896ZM64.3396 21.2188H66.949V19.0469H64.3396V21.2188Z" fill="white"/>
                    </svg>
                  </div>
                 </div>
               )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
