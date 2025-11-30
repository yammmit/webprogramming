import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { fetchGroupById, leaveGroup } from '../../api/groups';
import api from '../../api/axiosInstance';

export default function GroupSpecific() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const normalizeGroup = (g) => {
    if (!g) return g;
    return {
      ...g,
      members: (g.members || []).map((m) => (m && m.user ? m.user : m)),
    };
  };

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
        if (!cancelled) setGroup(normalizeGroup(g));
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [groupId]);

  async function handleLeave(targetUserId) {
    if (!confirm('정말로 방에서 탈퇴하시겠습니까?')) return;
    // only allow current user to leave themselves
    if (Number(targetUserId) !== Number(currentUserId)) {
      alert('본인만 탈퇴할 수 있습니다');
      return;
    }
    setProcessing(true);
    try {
      await api.delete(`/groups/${groupId}/leave`);
      // update local state so UI reflects change
      setGroup((prev) => (prev ? { ...prev, members: (prev.members || []).filter((m) => Number(m.user_id) !== Number(currentUserId)) } : prev));
      alert('탈퇴되었습니다');
      navigate(-1);
    } catch (e) {
      console.error(e);
      alert('탈퇴 실패');
    } finally {
      setProcessing(false);
    }
  }

  // search users by partial email / name
  async function handleSearchUsers() {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setInviteError('2자 이상 입력해 주세요');
      return;
    }
    setInviteError('');
    setSearching(true);
    try {
      const res = await api.get('/users/search', { params: { query: searchQuery } });
      // expect { users: [...] }
      const users = res.data?.users && Array.isArray(res.data.users) ? res.data.users : [];
      setSearchResults(users);
    } catch (err) {
      console.error('search users error', err);
      setInviteError('사용자 검색에 실패했습니다');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  // invite by user_id
  async function handleInviteUser(user_id) {
    setInviteError('');
    setInviteLoading(true);
    try {
      const res = await api.post(`/groups/${groupId}/invite`, { user_id });
      alert('초대가 생성되었습니다');
      // optionally refresh group detail
      const g = await fetchGroupById(groupId);
      setGroup(normalizeGroup(g));
      setAddingMember(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('invite error', err);
      setInviteError(err.response?.data?.error || '초대 생성에 실패했습니다');
    } finally { setInviteLoading(false); }
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
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                    {addingMember ? (
                      <>
                        <input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="이메일 또는 이름 검색" style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e6e6e6' }} />
                        <button onClick={handleSearchUsers} disabled={searching} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#DF6437', color: '#fff' }}>{searching ? '검색중...' : '검색'}</button>
                        <button onClick={()=>{ setAddingMember(false); setSearchQuery(''); setSearchResults([]); setInviteError(''); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ccc', background: '#fff' }}>취소</button>
                      </>
                    ) : (
                      <button onClick={()=>setAddingMember(true)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #DF6437', background: '#fff', color: '#DF6437' }}>멤버 추가</button>
                    )}
                  </div>
                  {inviteError && <div style={{ color: 'red', marginTop: 8 }}>{inviteError}</div>}
                  {/* search results */}
                  {addingMember && searchResults.length > 0 && (
                    <div style={{ marginTop: 8, border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
                      {searchResults.map(u => (
                        <div key={u.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid #f7f7f7' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{u.user_name || u.name || u.email}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{u.user_email || u.email || ''}</div>
                          </div>
                          <div>
                            <button onClick={()=>handleInviteUser(u.user_id)} disabled={inviteLoading} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#DF6437', color: '#fff' }}>{inviteLoading ? '전송중...' : '초대'}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                 {(group.members || []).map((m) => {
                   const isMe = Number(m.user_id) === Number(currentUserId);
                   return (
                     <div key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                       <div>
                         <div style={{ fontWeight: 700 }}>{m.user_name}</div>
                         <div style={{ fontSize: 12, color: '#666' }}>{m.user_email || m.email || ''}</div>
                       </div>
                       <div>
                        {/* If this member is current owner, show transfer button to owner (if current user is owner) */}
                        {Number(group.owner_id) === Number(m.user_id) ? (
                          // display owner badge and if current user is owner, show transfer option against other members
                          <span style={{ fontSize: 12, color: '#DF6437', fontWeight: 700, marginRight: 8 }}>방장</span>
                        ) : null}

                        {Number(group.owner_id) === Number(currentUserId) && Number(m.user_id) !== Number(currentUserId) ? (
                          <button
                            onClick={async ()=>{
                              if (!confirm('해당 멤버에게 방장을 위임하시겠습니까?')) return;
                              try {
                                await api.post(`/groups/${groupId}/transfer-owner`, { new_owner_id: m.user_id });
                                const g = await fetchGroupById(groupId);
                                setGroup(normalizeGroup(g));
                                alert('위임되었습니다');
                              } catch (e) {
                                console.error('transfer error', e);
                                alert(e.response?.data?.error || '위임 실패');
                              }
                            }}
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #DF6437', background: '#fff', color: '#DF6437', marginRight: 8 }}
                          >
                            방장 위임
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleLeave(m.user_id)}
                          disabled={!isMe || processing || Number(group.owner_id) === Number(m.user_id)}
                          title={Number(group.owner_id) === Number(m.user_id) ? '방장은 탈퇴할 수 없습니다. 먼저 위임하세요' : (isMe ? '방에서 탈퇴' : '본인만 탈퇴할 수 있습니다')}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: isMe ? '#DF6437' : '#f0f0f0',
                            color: isMe ? '#fff' : '#999',
                            opacity: processing ? 0.6 : 1,
                            cursor: isMe && Number(group.owner_id) !== Number(m.user_id) ? 'pointer' : 'not-allowed',
                          }}
                        >
                          {processing && isMe ? '탈퇴중...' : '탈퇴'}
                        </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
              </div>
            ) : <div>그룹을 불러올 수 없습니다</div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
