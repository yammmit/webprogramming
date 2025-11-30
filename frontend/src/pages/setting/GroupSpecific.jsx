import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { fetchGroupById, leaveGroup } from '../../api/groups';

export default function GroupSpecific() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const g = await fetchGroupById(groupId);
        if (!cancelled) setGroup(g);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [groupId]);

  async function handleLeave() {
    if (!confirm('정말로 방에서 탈퇴하시겠습니까?')) return;
    setProcessing(true);
    try {
      await leaveGroup(groupId, currentUserId);
      // update local state so UI reflects change (optional)
      setGroup(prev => prev ? { ...prev, members: (prev.members || []).filter(m => Number(m.user_id) !== Number(currentUserId)) } : prev);
      alert('탈퇴되었습니다');
      navigate(-1);
    } catch (e) {
      console.error(e);
      alert('탈퇴 실패');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
        <div style={{ background: '#DF6437', padding: '12px 16px', color: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 6px 18px rgba(223,100,55,0.12)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} aria-label="뒤로가기" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
            <h2 style={{ margin: 0, fontSize: 20, flex: 1, textAlign: 'center' }}>{group?.group_name || '그룹'}</h2>
            <div style={{ width: 28 }} />
          </div>
        </div>

        <div style={{ background: '#fff', marginTop: 12, borderRadius: 8, padding: 12 }}>
          {loading ? <div>로딩중...</div> : (
            group ? (
              <div>
                <div style={{ marginBottom: 12, fontWeight: 800 }}>{group.group_name} 멤버</div>
                <div>
                  {(group.members || []).map(m => (
                    <div key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{m.user_name}</div>
                        {/* email hidden intentionally */}
                      </div>
                      <div>
                        {Number(m.user_id) === Number(currentUserId) ? (
                          <button onClick={handleLeave} disabled={processing} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#DF6437', color: '#fff', opacity: processing ? 0.6 : 1 }}>{processing ? '탈퇴중...' : '탈퇴'}</button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div>그룹을 불러올 수 없습니다</div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
