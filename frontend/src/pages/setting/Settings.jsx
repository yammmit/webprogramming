import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import { fetchMyGroups } from "../../api/groups";
import api from "../../api/axiosInstance";


export default function Settings() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("currentGroupId") || localStorage.getItem("group_id") || null;
  });
  const [pushEnabled, setPushEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("pushEnabled") !== "false";
  });
  const [groupMembers, setGroupMembers] = useState([]);

  // resolve user display name from localStorage
  let storedUser = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('user');
      if (raw) storedUser = JSON.parse(raw);
    } catch (e) {}
  }

  const user_name = (storedUser && (storedUser.user_name || storedUser.name)) || (typeof window !== 'undefined' && localStorage.getItem('user_name')) || '사용자';

  useEffect(() => {
    async function load() {
      try {
        // Prefer centralized api; fallback to fetchMyGroups if implemented
        let raw;
        try {
          const res = await api.get('/groups');
          raw = res.data;
        } catch (e) {
          console.warn('api.get(/groups) failed, falling back to fetchMyGroups', e);
          raw = await fetchMyGroups();
        }

        console.log('raw groups response:', raw);
        // Normalize shapes: array, { data: [...] }, { groups: [...] }, { groups: { data: [...] } }
        let normalized = [];
        if (Array.isArray(raw)) normalized = raw;
        else if (raw?.data && Array.isArray(raw.data)) normalized = raw.data;
        else if (raw?.groups && Array.isArray(raw.groups)) normalized = raw.groups;
        else if (raw?.groups?.data && Array.isArray(raw.groups.data)) normalized = raw.groups.data;
        else normalized = raw || [];

        // Ensure member entries are user objects (member.user) for UI consumption
        const groupsWithMembers = normalized.map((g) => ({
          ...g,
          members: (g.members || []).map((m) => (m && m.user ? m.user : m)),
        }));
        setGroups(groupsWithMembers);
        // If currently selected group is no longer in user's groups (e.g., user left), clear selection
        try {
          const current = localStorage.getItem('currentGroupId') || localStorage.getItem('group_id') || null;
          if (current && !normalized.find(g => String(g.group_id) === String(current))) {
            setSelectedGroupId(null);
            localStorage.removeItem('currentGroupId');
            localStorage.removeItem('group_id');
          }
        } catch (e) {}
      } catch (e) {
        console.error("Failed to load groups", e);
      }
    }
    load();
  }, []);

  // load members for selectedGroupId when it changes
  useEffect(() => {
    let cancelled = false;
    async function loadMembers() {
      if (!selectedGroupId) {
        setGroupMembers([]);
        return;
      }

      // try to read from loaded groups first
      const g = (groups || []).find((x) => String(x.group_id) === String(selectedGroupId));
      if (g && Array.isArray(g.members) && g.members.length > 0) {
        setGroupMembers(g.members);
        return;
      }

      // fallback: fetch group detail via API
      try {
        const res = await api.get(`/groups/${selectedGroupId}`);
        const data = res.data;
        // possible shapes: { members: [...] } or { group: { members: [...] } } or { data: { members: [...] } }
        let members = data?.members || data?.group?.members || data?.data?.members || [];
        // normalize member objects to user objects if nested
        members = (members || []).map((m) => (m && m.user ? m.user : m));
        if (!cancelled) setGroupMembers(members);
      } catch (e) {
        console.error('Failed to load group detail', e);
        if (!cancelled) setGroupMembers([]);
      }
    }
    loadMembers();
    return () => { cancelled = true; };
  }, [selectedGroupId, groups]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        if (selectedGroupId == null) localStorage.removeItem("currentGroupId");
        else localStorage.setItem("currentGroupId", String(selectedGroupId));
      }
    } catch (e) {}
  }, [selectedGroupId]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("pushEnabled", pushEnabled ? "true" : "false");
    } catch (e) {}
  }, [pushEnabled]);

  function handleGroupChange(e) {
    setSelectedGroupId(e.target.value);
  }

  return (
    <MainLayout>
      <div style={{ padding: 0 }}>
        <div style={{ background: '#DF6437', padding: '18px 16px', color: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 6px 18px rgba(223,100,55,0.12)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>설정</h2>
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
          {/* Group select card */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 6px 18px rgba(0,0,0,0.06)", marginTop: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>단체방 선택</div>
              <select value={selectedGroupId ?? ""} onChange={handleGroupChange} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6e6e6" }}>
                <option value="">선택된 방이 없습니다</option>
                {groups.map((g) => (
                  <option key={g.group_id} value={g.group_id}>{g.group_name}</option>
                ))}
              </select>

              {/* display selected group name and members (3 per line) */}
              {selectedGroupId && (
                <div style={{ marginTop: 8 }}>
                  {(() => {
                    const grp = groups.find(x => String(x.group_id) === String(selectedGroupId));
                    const groupName = grp?.group_name || '선택된 방';
                    const total = groupMembers.length;
                    const maxShow = 4;
                    const show = groupMembers.slice(0, maxShow).map(m => m.user_name || m.name || m.userName || '이름없음');
                    const remainder = Math.max(0, total - maxShow);
                    const namesStr = show.join(','); // no spaces
                    return (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 6 }}>{`${groupName} (총 ${total}명)`}</div>
                        {total === 0 ? (
                          <div style={{ color: '#888' }}>멤버가 없습니다</div>
                        ) : (
                          <div style={{ fontSize: 13, color: '#555' }}>
                            {namesStr}{remainder > 0 ? ` +${remainder}명` : ''}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Options list */}
          <div style={{ marginTop: 18, background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
            <button
              onClick={() => navigate("/settings/profile")}
              style={{ display: "flex", width: "100%", padding: 16, alignItems: "center", justifyContent: "space-between", border: "none", background: "transparent", cursor: "pointer" }}
            >
              <div style={{ fontSize: 16 }}>프로필 수정</div>
              <div style={{ color: "#999" }}>{">"}</div>
            </button>

            <hr style={{ margin: 0, border: "none", borderTop: "1px solid #f0f0f0" }} />

            <button
              onClick={() => navigate("/settings/password")}
              style={{ display: "flex", width: "100%", padding: 16, alignItems: "center", justifyContent: "space-between", border: "none", background: "transparent", cursor: "pointer" }}
            >
              <div style={{ fontSize: 16 }}>비밀번호 변경</div>
              <div style={{ color: "#999" }}>{">"}</div>
            </button>

            <hr style={{ margin: 0, border: "none", borderTop: "1px solid #f0f0f0" }} />

            <div style={{ display: "flex", width: "100%", padding: 16, alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 16 }}>푸시 알림</div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={pushEnabled} onChange={() => setPushEnabled((v) => !v)} />
              </label>
            </div>

            <hr style={{ margin: 0, border: "none", borderTop: "1px solid #f0f0f0" }} />

            <button
              onClick={() => navigate("/settings/groups")}
              style={{ display: "flex", width: "100%", padding: 16, alignItems: "center", justifyContent: "space-between", border: "none", background: "transparent", cursor: "pointer" }}
            >
              <div style={{ fontSize: 16 }}>그룹 설정</div>
              <div style={{ color: "#999" }}>{">"}</div>
            </button>

            <hr style={{ margin: 0, border: "none", borderTop: "1px solid #f0f0f0" }} />

            <button
              onClick={() => navigate("/settings/invitations")}
              style={{ display: "flex", width: "100%", padding: 16, alignItems: "center", justifyContent: "space-between", border: "none", background: "transparent", cursor: "pointer" }}
            >
              <div style={{ fontSize: 16 }}>내 초대함</div>
              <div style={{ color: "#999" }}>{">"}</div>
            </button>

            <hr style={{ margin: 0, border: "none", borderTop: "1px solid #f0f0f0" }} />

            <button
              onClick={() => {
                try {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('user_id');
                    localStorage.removeItem('currentGroupId');
                    localStorage.removeItem('pushEnabled');
                    // any other auth keys
                  }
                } catch (e) {}
                navigate('/auth');
              }}
              style={{ display: 'flex', width: '100%', padding: 16, alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 16, color: '#DF6437', fontWeight: 700 }}>로그아웃</div>
              <div style={{ color: '#999' }}>{'>'}</div>
            </button>
          </div>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </MainLayout>
  );
}
