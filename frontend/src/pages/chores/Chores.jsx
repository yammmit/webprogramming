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
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-20deg)', pointerEvents: 'none' }}>
                  <svg width="140" height="40" viewBox="0 0 119 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10.5L0.894748 1.50001L118.5 1.5L111 9.5L118.5 17.5L111 23L118.105 32H0.500003L8 24L0.500003 16L8 10.5Z" fill="#DF6437"/>
                    <path d="M49.7031 10.7969C51.7812 10.7969 53.2812 11.9688 53.2812 13.6875C53.2812 15.0781 52.2578 16.1406 50.7344 16.4688V17.5C51.8438 17.4375 52.9609 17.3359 54 17.1875L54.1562 18.6406C51.2344 19.1562 47.9688 19.2188 45.5938 19.2188L45.3906 17.6406C46.375 17.6406 47.5234 17.6328 48.7344 17.5938V16.4844C47.1641 16.1719 46.1094 15.1016 46.125 13.6875C46.1094 11.9688 47.6094 10.7969 49.7031 10.7969ZM49.7031 12.2969C48.6875 12.3125 47.9688 12.7969 47.9844 13.6875C47.9688 14.5469 48.6875 15.0625 49.7031 15.0625C50.7188 15.0625 51.4062 14.5469 51.4062 13.6875C51.4062 12.7969 50.7188 12.3125 49.7031 12.2969ZM56.7969 10.2344V14.7031H58.6094V16.3594H56.7969V21.0781H54.7969V10.2344H56.7969ZM57.2812 22.5781V24.1719H47.2656V20.125H49.2656V22.5781H57.2812ZM72.0896 21.2188V22.8594H59.074V21.2188H62.4021V19.0469H60.574V14.2656H68.6209V12.7344H60.5584V11.1406H70.5896V15.8594H62.574V17.4375H70.9178V19.0469H68.9021V21.2188H72.0896ZM64.3396 21.2188H66.949V19.0469H64.3396V21.2188Z" fill="white"/>
                  </svg>
                </div>
               </div>
             )}

             {/* assigned-but-not-completed decorative overlay */}
             {task.status === 'assigned' && (
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
                   <svg width="119" height="34" viewBox="0 0 119 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M8 9.5L0.894748 0.50001L118.5 0.5L111 8.5L118.5 16.5L111 22L118.105 31H0.500003L8 23L0.500003 15L8 9.5Z" fill="#DF6437"/>
                     <path d="M29.312 10.144H30.576V13.664H33.616V10.144H34.848V19.632H29.312V10.144ZM30.576 14.736V18.544H33.616V14.736H30.576ZM39.824 8.768H41.104V23.248H39.824V8.768ZM37.504 14.496H40.288V15.6H37.504V14.496ZM36.608 9.072H37.872V22.512H36.608V9.072ZM51.0708 12.528H54.3188V13.632H51.0708V12.528ZM53.9188 8.768H55.2468V17.392H53.9188V8.768ZM50.4788 17.84C51.4814 17.84 52.3401 17.9467 53.0548 18.16C53.7801 18.3733 54.3348 18.6827 54.7188 19.088C55.1028 19.4827 55.2948 19.968 55.2948 20.544C55.2948 21.3973 54.8628 22.0587 53.9988 22.528C53.1454 22.9973 51.9721 23.232 50.4788 23.232C48.9854 23.232 47.8068 22.9973 46.9428 22.528C46.0894 22.0587 45.6628 21.3973 45.6628 20.544C45.6628 19.968 45.8548 19.4827 46.2388 19.088C46.6334 18.6827 47.1881 18.3733 47.9028 18.16C48.6281 17.9467 49.4868 17.84 50.4788 17.84ZM50.4788 18.88C49.7534 18.88 49.1294 18.944 48.6068 19.072C48.0841 19.2 47.6788 19.3867 47.3908 19.632C47.1134 19.8773 46.9748 20.1813 46.9748 20.544C46.9748 20.8853 47.1134 21.1787 47.3908 21.424C47.6788 21.6693 48.0841 21.8613 48.6068 22C49.1294 22.128 49.7534 22.192 50.4788 22.192C51.2148 22.192 51.8388 22.128 52.3508 22C52.8734 21.8613 53.2734 21.6693 53.5508 21.424C53.8388 21.1787 53.9828 20.8853 53.9828 20.544C53.9828 20.1813 53.8388 19.8773 53.5508 19.632C53.2734 19.3867 52.8734 19.2 52.3508 19.072C51.8388 18.944 51.2148 18.88 50.4788 18.88ZM47.0228 10.24H48.1108V11.408C48.1108 12.2933 47.9401 13.1253 47.5988 13.904C47.2681 14.672 46.7988 15.3493 46.1908 15.936C45.5828 16.512 44.8788 16.9547 44.0788 17.264L43.3908 16.208C43.9348 16.016 44.4254 15.7547 44.8628 15.424C45.3108 15.0933 45.6948 14.7147 46.0148 14.288C46.3454 13.8613 46.5961 13.4027 46.7668 12.912C46.9374 12.4213 47.0228 11.92 47.0228 11.408V10.24ZM47.2788 10.24H48.3668V11.392C48.3668 12.0107 48.5108 12.6133 48.7988 13.2C49.0868 13.7867 49.4974 14.304 50.0308 14.752C50.5641 15.2 51.1774 15.552 51.8708 15.808L51.1988 16.864C50.4094 16.576 49.7214 16.16 49.1348 15.616C48.5481 15.0613 48.0894 14.4213 47.7588 13.696C47.4388 12.9707 47.2788 12.2027 47.2788 11.392V10.24ZM43.8068 9.824H51.5348V10.912H43.8068V9.824ZM66.2504 14.784H67.5784V16.976H66.2504V14.784ZM66.8744 9.44C67.5677 9.44 68.181 9.56267 68.7144 9.808C69.2584 10.0427 69.6797 10.3733 69.9784 10.8C70.2877 11.2267 70.4424 11.7227 70.4424 12.288C70.4424 12.8533 70.2877 13.3547 69.9784 13.792C69.6797 14.2187 69.2584 14.5547 68.7144 14.8C68.181 15.0347 67.5677 15.152 66.8744 15.152C66.181 15.152 65.5624 15.0347 65.0184 14.8C64.485 14.5547 64.0637 14.2187 63.7544 13.792C63.4557 13.3547 63.3064 12.8533 63.3064 12.288C63.3064 11.7227 63.4557 11.2267 63.7544 10.8C64.0637 10.3733 64.485 10.0427 65.0184 9.808C65.5624 9.56267 66.181 9.44 66.8744 9.44ZM66.8744 10.464C66.4264 10.464 66.0264 10.5387 65.6744 10.688C65.3224 10.8373 65.045 11.0507 64.8424 11.328C64.6504 11.6053 64.5544 11.9253 64.5544 12.288C64.5544 12.6507 64.6504 12.9707 64.8424 13.248C65.045 13.5253 65.3224 13.744 65.6744 13.904C66.0264 14.0533 66.4264 14.128 66.8744 14.128C67.333 14.128 67.733 14.0533 68.0744 13.904C68.4264 13.744 68.6984 13.5253 68.8904 13.248C69.093 12.9707 69.1944 12.6507 69.1944 12.288C69.1944 11.9253 69.093 11.6053 68.8904 11.328C68.6984 11.0507 68.4264 10.8373 68.0744 10.688C67.733 10.5387 67.333 10.464 66.8744 10.464ZM72.3944 8.784H73.7224V19.856H72.3944V8.784ZM73.1624 13.664H75.8344V14.784H73.1624V13.664ZM64.5704 21.824H74.2344V22.912H64.5704V21.824ZM64.5704 18.912H65.8984V22.304H64.5704V18.912ZM62.6504 17.712L62.4904 16.608C63.333 16.608 64.261 16.6027 65.2744 16.592C66.2984 16.5707 67.3437 16.528 68.4104 16.464C69.477 16.3893 70.501 16.2773 71.4824 16.128L71.5784 17.104C70.5757 17.2853 69.541 17.4187 68.4744 17.504C67.4184 17.5893 66.389 17.648 65.3864 17.68C64.3944 17.7013 63.4824 17.712 62.6504 17.712ZM80.7131 17.248H82.0091V20.8H80.7131V17.248ZM85.3371 17.232H86.6331V20.784H85.3371V17.232ZM77.0491 20.352H90.1691V21.456H77.0491V20.352ZM78.6491 9.84H88.5371V14.224H79.9931V17.12H78.6811V13.152H87.2251V10.928H78.6491V9.84ZM78.6811 16.544H88.8731V17.632H78.6811V16.544Z" fill="white"/>
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
function HorizontalTaskRow({ tasks, cardBase = '/main/assigned-request', assignedNames = {} }) {
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
                        {assignedNames[task.assigned_to] || (task.assignedTo?.user_name || task.assignedTo?.name) || String(task.assigned_to) || '알수없음'}
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
                       {assignedNames[task.assigned_to] || (task.assignedTo?.user_name || task.assignedTo?.name) || String(task.assigned_to) || '알수없음'}
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
                         <path d="M49.7031 10.7969C51.7812 10.7969 53.2812 11.9688 53.2812 13.6875C53.2812 15.0781 52.2578 16.1406 50.7344 16.4688V17.5C51.8438 17.4375 52.9609 17.3359 54 17.1875L54.1562 18.6406C51.2344 19.1562 47.9688 19.2188 45.5938 19.2188L45.3906 17.6406C46.375 17.6406 47.5234 17.6328 48.7344 17.5938V16.4844C47.1641 16.1719 46.1094 15.1016 46.125 13.6875C46.1094 11.9688 47.6094 10.7969 49.7031 10.7969ZM49.7031 12.2969C48.6875 12.3125 47.9688 12.7969 47.9844 13.6875C47.9688 14.5469 48.6875 15.0625 49.7031 15.0625C50.7188 15.0625 51.4062 14.5469 51.4062 13.6875C51.4062 12.7969 50.7188 12.3125 49.7031 12.2969ZM56.7969 10.2344V14.7031H58.6094V16.3594H56.7969V21.0781H54.7969V10.2344H56.7969ZM57.2812 22.5781V24.1719H47.2656V20.125H49.2656V22.5781H57.2812ZM72.0896 21.2188V22.8594H59.074V21.2188H62.4021V19.0469H60.574V14.2656H68.6209V12.7344H60.5584V11.1406H70.5896V15.8594H62.574V17.4375H70.9178V19.0469H68.9021V21.2188H72.0896ZM64.3396 21.2188H66.949V19.0469H64.3396V21.2188Z" fill="white"/>
                   </svg>
                 </div>
               </div>
             )}

             {/* assigned full-bleed overlay for HorizontalTaskRow cards */}
             {task.status === 'assigned' && (
               <div style={{
                     position: 'absolute',
                     inset: 0,
                     borderRadius: 12,
                     background: 'rgba(69,75,76,0.79)',
                     display: 'flex',
                     flexDirection: 'column',
                     justifyContent: 'flex-end',
                     padding: 12,
                     boxSizing: 'border-box',
                     zIndex: 20,
                   }}>
                   <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-20deg)', pointerEvents: 'none' }}>
                     <svg width="119" height="34" viewBox="0 0 119 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M8 9.5L0.894748 0.50001L118.5 0.5L111 8.5L118.5 16.5L111 22L118.105 31H0.500003L8 23L0.500003 15L8 9.5Z" fill="#DF6437"/>
                       <path d="M29.312 10.144H30.576V13.664H33.616V10.144H34.848V19.632H29.312V10.144ZM30.576 14.736V18.544H33.616V14.736H30.576ZM39.824 8.768H41.104V23.248H39.824V8.768ZM37.504 14.496H40.288V15.6H37.504V14.496ZM36.608 9.072H37.872V22.512H36.608V9.072ZM51.0708 12.528H54.3188V13.632H51.0708V12.528ZM53.9188 8.768H55.2468V17.392H53.9188V8.768ZM50.4788 17.84C51.4814 17.84 52.3401 17.9467 53.0548 18.16C53.7801 18.3733 54.3348 18.6827 54.7188 19.088C55.1028 19.4827 55.2948 19.968 55.2948 20.544C55.2948 21.3973 54.8628 22.0587 53.9988 22.528C53.1454 22.9973 51.9721 23.232 50.4788 23.232C48.9854 23.232 47.8068 22.9973 46.9428 22.528C46.0894 22.0587 45.6628 21.3973 45.6628 20.544C45.6628 19.968 45.8548 19.4827 46.2388 19.088C46.6334 18.6827 47.1881 18.3733 47.9028 18.16C48.6281 17.9467 49.4868 17.84 50.4788 17.84ZM50.4788 18.88C49.7534 18.88 49.1294 18.944 48.6068 19.072C48.0841 19.2 47.6788 19.3867 47.3908 19.632C47.1134 19.8773 46.9748 20.1813 46.9748 20.544C46.9748 20.8853 47.1134 21.1787 47.3908 21.424C47.6788 21.6693 48.0841 21.8613 48.6068 22C49.1294 22.128 49.7534 22.192 50.4788 22.192C51.2148 22.192 51.8388 22.128 52.3508 22C52.8734 21.8613 53.2734 21.6693 53.5508 21.424C53.8388 21.1787 53.9828 20.8853 53.9828 20.544C53.9828 20.1813 53.8388 19.8773 53.5508 19.632C53.2734 19.3867 52.8734 19.2 52.3508 19.072C51.8388 18.944 51.2148 18.88 50.4788 18.88ZM47.0228 10.24H48.1108V11.408C48.1108 12.2933 47.9401 13.1253 47.5988 13.904C47.2681 14.672 46.7988 15.3493 46.1908 15.936C45.5828 16.512 44.8788 16.9547 44.0788 17.264L43.3908 16.208C43.9348 16.016 44.4254 15.7547 44.8628 15.424C45.3108 15.0933 45.6948 14.7147 46.0148 14.288C46.3454 13.8613 46.5961 13.4027 46.7668 12.912C46.9374 12.4213 47.0228 11.92 47.0228 11.408V10.24ZM47.2788 10.24H48.3668V11.392C48.3668 12.0107 48.5108 12.6133 48.7988 13.2C49.0868 13.7867 49.4974 14.304 50.0308 14.752C50.5641 15.2 51.1774 15.552 51.8708 15.808L51.1988 16.864C50.4094 16.576 49.7214 16.16 49.1348 15.616C48.5481 15.0613 48.0894 14.4213 47.7588 13.696C47.4388 12.9707 47.2788 12.2027 47.2788 11.392V10.24ZM43.8068 9.824H51.5348V10.912H43.8068V9.824ZM66.2504 14.784H67.5784V16.976H66.2504V14.784ZM66.8744 9.44C67.5677 9.44 68.181 9.56267 68.7144 9.808C69.2584 10.0427 69.6797 10.3733 69.9784 10.8C70.2877 11.2267 70.4424 11.7227 70.4424 12.288C70.4424 12.8533 70.2877 13.3547 69.9784 13.792C69.6797 14.2187 69.2584 14.5547 68.7144 14.8C68.181 15.0347 67.5677 15.152 66.8744 15.152C66.181 15.152 65.5624 15.0347 65.0184 14.8C64.485 14.5547 64.0637 14.2187 63.7544 13.792C63.4557 13.3547 63.3064 12.8533 63.3064 12.288C63.3064 11.7227 63.4557 11.2267 63.7544 10.8C64.0637 10.3733 64.485 10.0427 65.0184 9.808C65.5624 9.56267 66.181 9.44 66.8744 9.44ZM66.8744 10.464C66.4264 10.464 66.0264 10.5387 65.6744 10.688C65.3224 10.8373 65.045 11.0507 64.8424 11.328C64.6504 11.6053 64.5544 11.9253 64.5544 12.288C64.5544 12.6507 64.6504 12.9707 64.8424 13.248C65.045 13.5253 65.3224 13.744 65.6744 13.904C66.0264 14.0533 66.4264 14.128 66.8744 14.128C67.333 14.128 67.733 14.0533 68.0744 13.904C68.4264 13.744 68.6984 13.5253 68.8904 13.248C69.093 12.9707 69.1944 12.6507 69.1944 12.288C69.1944 11.9253 69.093 11.6053 68.8904 11.328C68.6984 11.0507 68.4264 10.8373 68.0744 10.688C67.733 10.5387 67.333 10.464 66.8744 10.464ZM72.3944 8.784H73.7224V19.856H72.3944V8.784ZM73.1624 13.664H75.8344V14.784H73.1624V13.664ZM64.5704 21.824H74.2344V22.912H64.5704V21.824ZM64.5704 18.912H65.8984V22.304H64.5704V18.912ZM62.6504 17.712L62.4904 16.608C63.333 16.608 64.261 16.6027 65.2744 16.592C66.2984 16.5707 67.3437 16.528 68.4104 16.464C69.477 16.3893 70.501 16.2773 71.4824 16.128L71.5784 17.104C70.5757 17.2853 69.541 17.4187 68.4744 17.504C67.4184 17.5893 66.389 17.648 65.3864 17.68C64.3944 17.7013 63.4824 17.712 62.6504 17.712ZM80.7131 17.248H82.0091V20.8H80.7131V17.248ZM85.3371 17.232H86.6331V20.784H85.3371V17.232ZM77.0491 20.352H90.1691V21.456H77.0491V20.352ZM78.6491 9.84H88.5371V14.224H79.9931V17.12H78.6811V13.152H87.2251V10.928H78.6491V9.84ZM78.6811 16.544H88.8731V17.632H78.6811V16.544Z" fill="white"/>
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