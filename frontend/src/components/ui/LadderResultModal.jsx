import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axiosInstance';
import { fetchUsersByIds } from '../../api/users';

export default function LadderResultModal({ visible, result, onClose, onViewTask }) {
  const pathRef = useRef(null);
  const markerRef = useRef(null);
  const [animating, setAnimating] = useState(false);
  const [localParticipants, setLocalParticipants] = useState(null);
  const [enrichedParticipants, setEnrichedParticipants] = useState(null);
  const [resolvedParticipants, setResolvedParticipants] = useState(null);
  const [assignedName, setAssignedName] = useState(null);

  useEffect(() => {
    if (!visible || !result) return;
    if (result.group_id) {
      (async () => {
        try {
          const res = await api.get(`/groups/${result.group_id}/members`);
          const members = res.data?.members ?? res.data ?? [];
          const mapped = members.map((m, idx) => ({
            user_id: m.user_id ?? m.user?.user_id ?? idx + 1,
            user_name: m.user_name ?? m.user?.user_name ?? m.user?.name ?? `참여자 ${idx + 1}`,
            name: m.user_name ?? m.user?.user_name ?? m.user?.name ?? `참여자 ${idx + 1}`
          }));
          setLocalParticipants(mapped);
          console.debug('LadderResultModal: fetched group members', { members, mapped, group_id: result.group_id });
        } catch (e) {
          console.warn('Failed to load group members:', e);
        }
      })();
    }
  }, [visible, result]);

  useEffect(() => {
    if (!visible || !result) return;
    const pathEl = pathRef.current;
    const markerEl = markerRef.current;
    if (!pathEl || !markerEl) return;

    const total = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = total;
    pathEl.style.strokeDashoffset = total;
    pathEl.style.transition = 'stroke-dashoffset 1.6s ease-in-out';

    const duration = 1600;
    let start = null;
    setAnimating(true);
    requestAnimationFrame(() => { pathEl.style.strokeDashoffset = '0'; });

    function step(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / duration);
      const draw = total * t;
      const pt = pathEl.getPointAtLength(draw);
      markerEl.setAttribute('cx', pt.x);
      markerEl.setAttribute('cy', pt.y);
      if (t < 1) requestAnimationFrame(step);
      else setAnimating(false);
    }
    requestAnimationFrame(step);
    return () => {
      try {
        pathEl.style.transition = '';
        pathEl.style.strokeDashoffset = '';
        pathEl.style.strokeDasharray = '';
      } catch (_) {}
      setAnimating(false);
    };
  }, [visible, result]);

  useEffect(() => {
    if (!visible || !result) return;
    if (!Array.isArray(result.participants)) return;
    (async () => {
      try {
        const missingIds = [];
        result.participants.forEach((p, idx) => {
          const id = p?.user_id ?? p?.id ?? idx + 1;
          const rawName = p?.user_name || p?.name || p?.user?.user_name || p?.user?.name || '';
          const looksPlaceholder = /^\s*$/.test(rawName) || /^참여자\s*\d+$/.test(rawName) || /^\d+$/.test(rawName) || String(rawName) === String(id);
          if (!rawName || looksPlaceholder) missingIds.push(Number(id));
        });
        const uniq = Array.from(new Set(missingIds.filter(n => !Number.isNaN(n))));
        let fetched = [];
        if (uniq.length) fetched = await fetchUsersByIds(uniq);
        const nameMap = {};
        fetched.forEach(u => { nameMap[Number(u.user_id) || Number(u.id)] = u.user_name || u.name || u.displayName; });
        const final = result.participants.map((p, idx) => {
          const id = p?.user_id ?? p?.id ?? idx + 1;
          const name = p?.user_name || p?.name || p?.user?.user_name || p?.user?.name || nameMap[Number(id)] || `참여자 ${idx+1}`;
          return { user_id: id, user_name: name, name };
        });
        setEnrichedParticipants(final);
        console.debug('LadderResultModal: enrichedParticipants', final);
      } catch (e) {}
    })();
  }, [visible, result]);

  useEffect(() => {
    if (!visible || !result) return;
    (async () => {
      try {
        if (Array.isArray(localParticipants) && localParticipants.length > 0) {
          setResolvedParticipants(localParticipants);
          console.debug('LadderResultModal: resolved from localParticipants', localParticipants);
          return;
        }
        if (Array.isArray(result.participants) && result.participants.length > 0) {
          const ids = [];
          const initial = result.participants.map((p, idx) => {
            const id = typeof p === 'number' || typeof p === 'string' ? Number(p) : (p?.user_id ?? p?.id ?? idx + 1);
            const name = p && (p.user_name || p.name || p.user?.user_name || p.user?.name) ? (p.user_name || p.name || p.user?.user_name || p.user?.name) : null;
            if (!name && id != null) ids.push(Number(id));
            return { user_id: id, user_name: name };
          });
          const assignedId = Number(result.assigned_to?.user_id ?? result.assigned_to ?? NaN);
          const winnerId = Number(result.winner?.user_id ?? result.winner?.id ?? NaN);
          if (!Number.isNaN(assignedId) && !ids.includes(assignedId)) ids.push(assignedId);
          if (!Number.isNaN(winnerId) && !ids.includes(winnerId)) ids.push(winnerId);
          const uniq = Array.from(new Set(ids.filter(n => !Number.isNaN(n))));
          let fetched = [];
          if (uniq.length) {
            try { fetched = await fetchUsersByIds(uniq); } catch (e) { fetched = []; }
          }
          const idMap = {};
          fetched.forEach(u => { idMap[Number(u.user_id) || Number(u.id)] = u.user_name || u.name; });
          (Array.isArray(localParticipants) ? localParticipants : []).forEach(p => { idMap[Number(p.user_id)] = p.user_name ?? p.name ?? idMap[Number(p.user_id)]; });
          (Array.isArray(enrichedParticipants) ? enrichedParticipants : []).forEach(p => { idMap[Number(p.user_id)] = p.user_name ?? p.name ?? idMap[Number(p.user_id)]; });
          const final = initial.map((it, idx) => {
            const id = it.user_id ?? idx + 1;
            const name = it.user_name || idMap[Number(id)] || (enrichedParticipants?.[idx]?.user_name) || `참여자 ${idx+1}`;
            return { user_id: id, user_name: name, name };
          });
          setResolvedParticipants(final);
          console.debug('LadderResultModal: resolvedParticipants from result.participants', final);
          return;
        }
        if (Array.isArray(enrichedParticipants) && enrichedParticipants.length > 0) {
          setResolvedParticipants(enrichedParticipants);
          console.debug('LadderResultModal: resolved from enrichedParticipants', enrichedParticipants);
          return;
        }
        setResolvedParticipants(null);
      } catch (e) {
        setResolvedParticipants(null);
      }
    })();
  }, [visible, result, localParticipants, enrichedParticipants]);

  useEffect(() => {
    // resolve assigned/winner user name to display exact user name
    setAssignedName(null);
    (async () => {
      try {
        if (!result) return;
        // determine candidate id from result.assigned_to or result.winner
        let candidate = null;
        if (result.assigned_to) {
          candidate = typeof result.assigned_to === 'object' ? Number(result.assigned_to.user_id ?? result.assigned_to.id) : Number(result.assigned_to);
        }
        if ((!candidate || Number.isNaN(candidate)) && result.winner) {
          candidate = Number(result.winner.user_id ?? result.winner.id);
        }
        if (!candidate || Number.isNaN(candidate)) return;

        // check localParticipants/resolvedParticipants first
        const lookup = (Array.isArray(localParticipants) ? localParticipants : []).concat(Array.isArray(resolvedParticipants) ? resolvedParticipants : []);
        const foundLocal = lookup.find(p => Number(p.user_id) === Number(candidate));
        if (foundLocal) { setAssignedName(foundLocal.user_name ?? foundLocal.name); return; }

        // fetch user info
        try {
          const fetched = await fetchUsersByIds([candidate]);
          if (Array.isArray(fetched) && fetched.length > 0) {
            const u = fetched[0];
            setAssignedName(u.user_name || u.name || null);
            return;
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {}
    })();
  }, [visible, result, localParticipants, resolvedParticipants]);

  if (!visible || !result) return null;

  let participants = [];
  if (Array.isArray(resolvedParticipants) && resolvedParticipants.length > 0) participants = resolvedParticipants;
  else if (Array.isArray(localParticipants) && localParticipants.length > 0) participants = localParticipants;
  else if (Array.isArray(result.participants) && result.participants.length > 0) participants = (enrichedParticipants ?? result.participants).map((p, idx) => ({ user_id: p.user_id ?? p.id ?? idx + 1, user_name: p.user_name ?? p.name ?? `참여자 ${idx + 1}`, name: p.user_name ?? p.name ?? `참여자 ${idx + 1}` }));
  else if (Array.isArray(enrichedParticipants) && enrichedParticipants.length > 0) participants = enrichedParticipants;
  else if (result.total_members > 0) participants = Array.from({ length: result.total_members }).map((_, i) => ({ user_id: i + 1, user_name: `참여자 ${i + 1}` }));
  else participants = [{ user_id: 1, user_name: '참여자 1' }, { user_id: 2, user_name: '참여자 2' }];

  console.debug('LadderResultModal: participants used for render', { participants, resultParticipants: result.participants, localParticipants, enrichedParticipants });

  const columns = Math.max(1, participants.length);

  let bottom_result = Array(columns).fill('꽝');
  if (Array.isArray(result.bottom_result) && result.bottom_result.length === columns) bottom_result = result.bottom_result.slice();
  else if (result.assigned_to) {
    const assignedId = Number(result.assigned_to?.user_id ?? result.assigned_to);
    const idx = participants.findIndex(p => Number(p.user_id) === assignedId);
    if (idx >= 0) bottom_result[idx] = '당첨';
  }
  const winIdx = bottom_result.findIndex(v => v === '당첨');

  let displayWinnerName = null;

  let ladder_map = Array.isArray(result.ladder_map) ? result.ladder_map : [];
  if (!Array.isArray(ladder_map) || ladder_map.length === 0) {
    function seededRandom(seed) {
      let t = seed >>> 0;
      return function() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r = (r + Math.imul(r ^ (r >>> 7), r | 61)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    }
    const seed = Number(result.taskId ?? result.task_id ?? 1) + (participants.length << 8);
    const rand = seededRandom(seed);
    const rows = 7;
    const gen = [];
    for (let r = 0; r < rows; r++) {
      let prev = false;
      for (let c = 0; c < Math.max(0, participants.length - 1); c++) {
        if (prev) { prev = false; continue; }
        if (rand() < 0.28) { gen.push({ row: r + 1, column: c + 1 }); prev = true; }
      }
    }
    ladder_map = gen;
  }
  let levels = 6;
  if (ladder_map.length > 0) levels = Math.max(...ladder_map.map(r => Number(r.row || 0)));

  const width = 360;
  const height = 340;
  const leftPad = 40;
  const rightPad = 40;
  const usable = width - leftPad - rightPad;
  const xPositions = Array.from({ length: columns }).map((_, i) => Math.round(leftPad + (usable * i) / Math.max(columns - 1, 1)));
  const topY = 60;
  const bottomY = 260;
  const levelStep = (bottomY - topY) / (levels + 1);

  const connections = Array.from({ length: levels }).map(() => Array(columns - 1).fill(false));
  ladder_map.forEach(item => {
    const row = Number(item.row);
    const col = Number(item.column);
    if (row >= 1 && row <= levels && col >= 1 && col <= columns - 1) connections[row - 1][col - 1] = true;
  });

  function simulateEndFromStart(startIdx) {
    let cur = startIdx;
    for (let lvl = 0; lvl < levels; lvl++) {
      if (connections[lvl][cur]) { cur += 1; continue; }
      if (cur - 1 >= 0 && connections[lvl][cur - 1]) { cur -= 1; continue; }
    }
    return cur;
  }

  // choose target end index (prefer assigned_to or winner id mapped to participant index)
  let targetEndIndex = -1;
  const assignedIdForTarget = Number(result.assigned_to?.user_id ?? result.assigned_to ?? NaN);
  const winnerObjIdForTarget = Number(result.winner?.user_id ?? result.winner?.id ?? NaN);
  if (!Number.isNaN(assignedIdForTarget)) {
    const idx = participants.findIndex(p => Number(p.user_id) === assignedIdForTarget);
    if (idx >= 0) targetEndIndex = idx;
  }
  if (targetEndIndex < 0 && !Number.isNaN(winnerObjIdForTarget)) {
    const idx2 = participants.findIndex(p => Number(p.user_id) === winnerObjIdForTarget);
    if (idx2 >= 0) targetEndIndex = idx2;
  }
  // fallback to server bottom_result index
  if (targetEndIndex < 0 && winIdx >= 0) targetEndIndex = winIdx;

  // now invert ladder to find a startIndex that leads to targetEndIndex
  let startIndex;
  if (targetEndIndex >= 0) {
    // prefer explicit server result_map inversion if available (result_map uses 1-based indices)
    if (result.result_map && typeof result.result_map === 'object') {
      try {
        for (const k of Object.keys(result.result_map)) {
          const end = Number(result.result_map[k]);
          if (!Number.isNaN(end) && end - 1 === targetEndIndex) { startIndex = Number(k) - 1; break; }
        }
      } catch (e) {}
    }

    // brute-force simulate each possible start to find match
    if (typeof startIndex === 'undefined') {
      for (let s = 0; s < columns; s++) {
        try {
          if (simulateEndFromStart(s) === targetEndIndex) { startIndex = s; break; }
        } catch (e) {}
      }
    }
  }

  if (typeof startIndex === 'undefined') startIndex = Math.floor((columns - 1) / 2);

  let curIndex = startIndex;
  const cmds = [];
  let curY = topY - levelStep;
  cmds.push(`M ${xPositions[curIndex]} ${curY}`);
  for (let lvl = 0; lvl < levels; lvl++) {
    const y = Math.round(topY + (lvl + 1) * levelStep);
    cmds.push(`L ${xPositions[curIndex]} ${y}`);
    if (connections[lvl][curIndex]) { curIndex += 1; cmds.push(`L ${xPositions[curIndex]} ${y}`); }
    else if (curIndex - 1 >= 0 && connections[lvl][curIndex - 1]) { curIndex -= 1; cmds.push(`L ${xPositions[curIndex]} ${y}`); }
  }
  cmds.push(`L ${xPositions[curIndex]} ${bottomY}`);
  const chosenPath = cmds.join('\n');

  const endIndex = curIndex;
  bottom_result = Array(columns).fill('꽝');
  if (endIndex >= 0 && endIndex < columns) bottom_result[endIndex] = '당첨';
  if (participants[endIndex]) displayWinnerName = participants[endIndex].user_name ?? participants[endIndex].name;
  if (!displayWinnerName) {
    const assignedIdObj2 = result.assigned_to && typeof result.assigned_to === 'object' ? Number(result.assigned_to.user_id ?? result.assigned_to.id) : null;
    const assignedIdRaw2 = result.assigned_to && typeof result.assigned_to !== 'object' ? Number(result.assigned_to) : null;
    const assignedId2 = !Number.isNaN(assignedIdObj2) ? assignedIdObj2 : (!Number.isNaN(assignedIdRaw2) ? assignedIdRaw2 : null);
    if (assignedId2 != null) {
      const found = participants.find(p => Number(p.user_id) === Number(assignedId2));
      if (found) displayWinnerName = found.user_name ?? found.name;
    }
  }
  if (!displayWinnerName && result.winner && (result.winner.user_name || result.winner.name)) displayWinnerName = result.winner.user_name || result.winner.name;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', zIndex: 4000 }}>
      <div style={{ width: 420, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <h3 style={{ marginBottom: 8, textAlign: 'center' }}>사다리 결과</h3>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>

            {xPositions.map((x, i) => {
              const isTopWinner = (typeof startIndex !== 'undefined') ? (i === startIndex) : (bottom_result[i] === '당첨');
              if (isTopWinner) {
                return (
                  <g key={`top-${i}`} transform={`translate(${x},18)`}> 
                    <rect x={-28} y={-14} width={56} height={24} rx={6} fill="#DF6437" />
                    <text x={0} y={4} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: '#fff' }}>당첨</text>
                  </g>
                );
              }
              return (
                <text key={`top-loser-${i}`} x={x} y={24} textAnchor="middle" style={{ fontSize: 12, fill: '#888' }}>꽝</text>
              );
            })}

            {xPositions.map((x, i) => (
              <line key={`rail-${i}`} x1={x} y1={topY - 8} x2={x} y2={bottomY + 8} stroke="#d0d5d9" strokeWidth={4} strokeLinecap="round" />
            ))}

            {connections.map((row, lvl) => (
              row.map((conn, i) => {
                if (!conn) return null;
                const y = Math.round(topY + (lvl + 1) * levelStep);
                const x1 = xPositions[i];
                const x2 = xPositions[i + 1];
                return <line key={`rung-${lvl}-${i}`} x1={x1} y1={y} x2={x2} y2={y} stroke="#e6e6e6" strokeWidth={2} />;
              })
            ))}

            <path ref={pathRef} d={chosenPath} fill="none" stroke="#DF6437" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <circle ref={markerRef} cx={xPositions[startIndex]} cy={topY} r={10} fill="#DF6437" />

            {xPositions.map((x, i) => {
              const isWinnerBottom = typeof endIndex === 'number' && i === endIndex;
              const name = isWinnerBottom ? (assignedName ?? participants[i]?.user_name ?? participants[i]?.name) : (participants[i]?.user_name ?? participants[i]?.name ?? `참여자 ${i+1}`);
              return (
                <text key={`p-bottom-${i}`} x={x} y={bottomY + 32} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: '#222' }}>
                  {name}
                </text>
              );
            })}

          </svg>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{ fontWeight: 700 }}>{!animating ? (assignedName ?? displayWinnerName ?? '알 수 없음') : ''}</div>
          <div style={{ color: '#666', marginTop: 6 }}>{animating ? '사다리 진행중...' : '배정 완료'}</div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #DF6437', color: '#DF6437' }}>닫기</button>
          <button onClick={onViewTask} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#DF6437', color: '#fff' }}>작업 보기</button>
        </div>
      </div>
    </div>
  );
}
