import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { fetchMyGroups } from '../../api/groups';

export default function GroupManage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [owners, setOwners] = useState({});

  // determine current user id
  const currentUserId = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.user_id) return Number(u.user_id);
      }
      const ls = localStorage.getItem('user_id') || localStorage.getItem('userId') || null;
      if (ls) return Number(ls);
    } catch (e) {}
    return null;
  })();

  useEffect(() => {
    async function load() {
      try {
        const g = await fetchMyGroups();
        setGroups(g || []);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  // determine ownership using groups[].members directly (no extra requests)
  useEffect(() => {
    const map = {};
    console.log('GroupManage groups payload:', groups);
    (groups || []).forEach((gr) => {
      if (gr && typeof gr.role === 'string') {
        // API returned a per-group role (simplified) e.g. { role: 'owner' }
        map[gr.group_id] = String(gr.role).toLowerCase() === 'owner';
      } else {
        const members = gr.members || [];
        const me = members.find(m => Number(m.user_id) === Number(currentUserId));
        map[gr.group_id] = !!(me && me.role === 'owner');
      }
    });
    setOwners(map);
    // debug log
    console.log('GroupManage debug: currentUserId=', currentUserId, 'owners=', map);
  }, [groups, currentUserId]);

  async function deleteGroup(groupId) {
    if (!confirm('정말로 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      const res = await fetch(`/groups/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        setGroups(prev => prev.filter(g => String(g.group_id) !== String(groupId)));
        alert('그룹이 삭제되었습니다');
      } else {
        const err = await res.json().catch(() => null);
        console.error('delete failed', err);
        alert('그룹 삭제에 실패했습니다');
      }
    } catch (e) {
      console.error(e);
      alert('네트워크 에러');
    }
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
        <div style={{ background: '#DF6437', padding: '12px 16px', color: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 6px 18px rgba(223,100,55,0.12)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} aria-label="뒤로가기" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
            <h2 style={{ margin: 0, fontSize: 20, flex: 1, textAlign: 'center' }}>그룹 관리</h2>
            <div style={{ width: 28 }} />
          </div>
        </div>

        <div style={{ background: '#fff', marginTop: 12, borderRadius: 8, padding: 12 }}>
          {groups.length === 0 ? (
            <div style={{ color: '#888' }}>소속된 그룹이 없습니다</div>
          ) : (
            groups.map(g => (
              <div key={g.group_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontWeight: 700 }}>{g.group_name}{owners[String(g.group_id)] ? ' (소유자)' : ''}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigate(`/settings/groups/${g.group_id}`)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #DF6437', background: '#fff', color: '#DF6437' }}>관리</button>
                  {owners[String(g.group_id)] ? (
                    <button onClick={() => deleteGroup(g.group_id)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#DF6437', color: '#fff' }}>삭제</button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
