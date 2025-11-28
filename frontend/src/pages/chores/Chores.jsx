// src/pages/main/Dashboard.jsx
import { useEffect, useState } from "react";
import { fetchMyGroups } from "../../api/groups";
import { fetchTasksByGroup } from "../../api/tasks";
import character from "../../assets/images/splash-character.png";
import Vcharacter from "../../assets/images/Vaccum_Character.png";
import StarRating from "../../components/ui/StarRating";
import { db } from '../../mocks/db';

import MainLayout from "../../components/layout/MainLayout";
import Card from "../../components/ui/Card";
import { useParams, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('unassigned');

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
        setLoading(false);
        return;
      }

      // find the selected group by route param (fallback to first)
      const selectedGroup = groupId ? groups.find(g => String(g.group_id) === String(groupId)) || groups[0] : groups[0];
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
  const currentUserId = (storedUser && storedUser.user_id) || (typeof window !== 'undefined' && Number(localStorage.getItem('user_id')));

  // tasks were loaded for the selected group, use tasks directly
  const groupTasks = tasks;

  // Assigned but not completed tasks (assigned to someone)
  const inProgress = groupTasks.filter((t) => t.assigned_to != null && t.status !== 'completed');

  // Unassigned tasks (available to be picked)
  const unassigned = groupTasks.filter((t) => t.assigned_to == null);

  // tasks that are completed and not yet reviewed by current user
  const toReview = groupTasks.filter((t) => {
    if (t.status !== 'completed') return false;
    // check mock reviews storage first
    const hasReviewed = (db.reviews && db.reviews.some(r => String(r.task_id) === String(t.task_id) && String(r.user_id) === String(currentUserId)))
      || (t.reviews && t.reviews.some(r => String(r.user_id) === String(currentUserId)));
    return !hasReviewed;
  });

  // banner counts (reflect selected tab, including review)
  const headerCount = selectedTab === 'unassigned' ? unassigned.length : (selectedTab === 'assigned' ? inProgress.length : (selectedTab === 'review' ? toReview.length : 0));
  const headerLabel = selectedTab === 'unassigned' ? '미배정된 집안일이' : (selectedTab === 'assigned' ? '진행중인 집안일이' : (selectedTab === 'review' ? '리뷰가 필요한 집안일이' : '집안일이'));

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
              <HorizontalTaskRow tasks={unassigned} />
            )
          )}

          {selectedTab === 'assigned' && (
            (inProgress.length === 0) ? (
              <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                배정된 집안일이 없어요
              </div>
            ) : (
              <HorizontalTaskRow tasks={inProgress} />
            )
          )}

          {selectedTab === 'review' && (
            (toReview.length === 0) ? (
              <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                평가할 항목이 없습니다
              </div>
            ) : (
              <HorizontalTaskRow tasks={toReview} cardBase={'/chores/review'} />
            )
          )}
        </section>
        
        {/* floating create button */}
        <div style={{ position: 'fixed', right: 230, bottom: 140, zIndex: 1100 }}>
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
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', pointerEvents: 'none' }}>
                  <svg width="140" height="40" viewBox="0 0 119 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10.5L0.894748 1.50001L118.5 1.5L111 9.5L118.5 17.5L111 23L118.105 32H0.500003L8 24L0.500003 16L8 10.5Z" fill="#DF6437"/>
                    <path d="M49.7031 10.7969C51.7812 10.7969 53.2812 11.9688 53.2812 13.6875C53.2812 15.0781 52.2578 16.1406 50.7344 16.4688V17.5C51.8438 17.4375 52.9609 17.3359 54 17.1875L54.1562 18.6406C51.2344 19.1562 47.9688 19.2188 45.5938 19.2188L45.3906 17.6406C46.375 17.6406 47.5234 17.6328 48.7344 17.5938V16.4844C47.1641 16.1719 46.1094 15.1016 46.125 13.6875C46.1094 11.9688 47.6094 10.7969 49.7031 10.7969ZM49.7031 12.2969C48.6875 12.3129 47.9688 12.7969 47.9844 13.6875C47.9688 14.5469 48.6875 15.0625 49.7031 15.0625C50.7188 15.0625 51.4062 14.5469 51.4062 13.6875C51.4062 12.7969 50.7188 12.3125 49.7031 12.2969ZM56.7969 10.2344V14.7031H58.6094V16.3594H56.7969V21.0781H54.7969V10.2344H56.7969ZM57.2812 22.5781V24.1719H47.2656V20.125H49.2656V22.5781H57.2812ZM72.0896 21.2188V22.8594H59.074V21.2188H62.4021V19.0469H60.574V14.2656H68.6209V12.7344H60.5584V11.1406H70.5896V15.8594H62.574V17.4375H70.9178V19.0469H68.9021V21.2188H72.0896ZM64.3396 21.2188H66.949V19.0469H64.3396V21.2188Z" fill="white"/>
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
function HorizontalTaskRow({ tasks, cardBase = '/main/assigned-request' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {tasks.map((task) => (
        <div key={task.task_id}>
          {task.assigned_to == null ? (
            <Card bare to={`${cardBase}/${task.task_id}`}>
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
                    {task.assigned_to != null && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 6, textAlign: 'center' }}>
                        {(() => { const u = db.users.find(x => x.user_id === task.assigned_to); return u ? u.user_name : '알수없음'; })()}
                      </div>
                    )}
                 </div>
               </div>
            </Card>
           ) : (
             <Card bare to={`${cardBase}/${task.task_id}`}>
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
                   {task.assigned_to != null && (
                     <div style={{ fontSize: 12, color: '#666', marginTop: 6, textAlign: 'center' }}>
                       {(() => { const u = db.users.find(x => x.user_id === task.assigned_to); return u ? u.user_name : '알수없음'; })()}
                     </div>
                   )}
                 </div>

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
                         <path d="M49.7031 10.7969C51.7812 10.7969 53.2812 11.9688 53.2812 13.6875C53.2812 15.0781 52.2578 16.1406 50.7344 16.4688V17.5C51.8438 17.4375 52.9609 17.3359 54 17.1875L54.1562 18.6406C51.2344 19.1562 47.9688 19.2188 45.5938 19.2188L45.3906 17.6406C46.375 17.6406 47.5234 17.6328 48.7344 17.5938V16.4844C47.1641 16.1719 46.1094 15.1016 46.125 13.6875C46.1094 11.9688 47.6094 10.7969 49.7031 10.7969ZM49.7031 12.2969C48.6875 12.3129 47.9688 12.7969 47.9844 13.6875C47.9688 14.5469 48.6875 15.0625 49.7031 15.0625C50.7188 15.0625 51.4062 14.5469 51.4062 13.6875C51.4062 12.7969 50.7188 12.3125 49.7031 12.2969ZM56.7969 10.2344V14.7031H58.6094V16.3594H56.7969V21.0781H54.7969V10.2344H56.7969ZM57.2812 22.5781V24.1719H47.2656V20.125H49.2656V22.5781H57.2812ZM72.0896 21.2188V22.8594H59.074V21.2188H62.4021V19.0469H60.574V14.2656H68.6209V12.7344H60.5584V11.1406H70.5896V15.8594H62.574V17.4375H70.9178V19.0469H68.9021V21.2188H72.0896ZM64.3396 21.2188H66.949V19.0469H64.3396V21.2188Z" fill="white"/>
                       </svg>
                     </div>
                   </div>
                 )}
               </div>
             </Card>
           )}
         </div>
       ))}
     </div>
   );
}
