import { useEffect, useState } from "react";
import { fetchMyGroups } from "../../api/groups";
import MainLayout from "../../components/layout/MainLayout";

export default function Settings() {
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      setLoading(true);
      const gs = (await fetchMyGroups()) || [];
      setGroups(gs);

      // determine initial selection: localStorage.currentGroupId -> most-recently-joined -> first
      let initial = null;
      const stored = typeof window !== "undefined" ? (localStorage.getItem("currentGroupId") || localStorage.getItem("group_id")) : null;

      if (stored) {
        const found = gs.find((g) => String(g.group_id) === String(stored));
        if (found) initial = String(found.group_id);
      }

      if (!initial && gs.length > 0) {
        // try pick most-recently-joined for current user
        let uid = null;
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("user");
            if (raw) uid = JSON.parse(raw)?.user_id;
          } catch (e) {
            // ignore
          }
          if (!uid) uid = localStorage.getItem("user_id") || localStorage.getItem("userId");
        }

        if (uid != null) {
          let best = null;
          let bestTime = 0;
          for (const g of gs) {
            const member = Array.isArray(g.members) ? g.members.find((m) => String(m.user_id) === String(uid)) : null;
            if (member && member.joined_at) {
              const t = new Date(member.joined_at).getTime();
              if (best === null || t > bestTime) {
                best = g;
                bestTime = t;
              }
            }
          }
          if (best) initial = String(best.group_id);
        }
      }

      if (!initial && gs.length > 0) initial = String(gs[0].group_id);

      if (initial) {
        setSelected(initial);
        try {
          localStorage.setItem("currentGroupId", initial);
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      console.error("Failed to load groups:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const v = e.target.value;
    setSelected(v);
    try {
      localStorage.setItem("currentGroupId", v);
    } catch (e) {
      // ignore
    }
  }

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>설정</h2>

        <section style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>내 단체방 선택</label>

          {loading ? (
            <div>불러오는 중...</div>
          ) : groups.length === 0 ? (
            <div>가입된 단체방이 없습니다.</div>
          ) : (
            <select value={selected} onChange={handleChange} style={{ padding: 8, borderRadius: 8, minWidth: 240 }}>
              {groups.map((g) => (
                <option key={g.group_id} value={g.group_id}>{g.group_name}</option>
              ))}
            </select>
          )}

          <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
            선택하면 대시보드와 하단 메뉴가 해당 그룹을 기준으로 표시됩니다.
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
