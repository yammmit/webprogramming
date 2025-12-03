import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axiosInstance';

export default function LadderResultModal({ visible, result, onClose, onViewTask }) {
  const pathRef = useRef(null);
  const markerRef = useRef(null);
  const [animating, setAnimating] = useState(false);
  const [localParticipants, setLocalParticipants] = useState(null);

  useEffect(() => {
    if (!visible || !result) return;
    // fetch group members if server didn't include participants
    if ((!Array.isArray(result.participants) || result.participants.length === 0) && result.group_id) {
      (async () => {
        try {
          const res = await api.get(`/groups/${result.group_id}/members`);
          // backend may return { members: [...] } or raw array
          const members = res.data?.members ?? res.data ?? [];
          const mapped = members.map((m, idx) => ({ user_id: m.user_id ?? m.user?.user_id ?? m.id ?? idx+1, user_name: m.user_name ?? m.user?.user_name ?? m.name ?? `참여자 ${idx+1}` }));
          setLocalParticipants(mapped);
        } catch (e) {
          console.warn('Failed to load group members for ladder modal', e?.message || e);
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
      const drawLen = total * t;
      const pt = pathEl.getPointAtLength(drawLen);
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
      } catch (e) {}
      setAnimating(false);
    };
  }, [visible, result]);

  if (!visible || !result) return null;

  // participants: prefer server-provided array, then fetched group members, then fallbacks
  let participants = [];
  if (Array.isArray(result.participants) && result.participants.length > 0) {
    participants = result.participants.map((p, idx) => ({ user_id: p.user_id ?? p.id ?? idx + 1, user_name: p.user_name ?? p.name ?? `참여자 ${idx + 1}` }));
  } else if (Array.isArray(localParticipants) && localParticipants.length > 0) {
    participants = localParticipants;
  } else if (Number(result.total_members) && Number(result.total_members) > 0) {
    participants = Array.from({ length: Number(result.total_members) }).map((_, i) => ({ user_id: i + 1, user_name: `참여자 ${i + 1}` }));
  } else {
    participants = [{ user_id: 1, user_name: '참여자 1' }, { user_id: 2, user_name: '참여자 2' }, { user_id: 3, user_name: '참여자 3' }];
  }

  const columns = Math.max(1, participants.length);

  // layout
  const width = 360;
  const height = 340;
  const leftPad = 40;
  const rightPad = 40;
  const usable = width - leftPad - rightPad;
  const xPositions = Array.from({ length: columns }).map((_, i) => Math.round(leftPad + (usable * i) / Math.max(columns - 1, 1)));

  // determine ladder connections from server ladder_map or generate deterministically
  let ladder_map = Array.isArray(result.ladder_map) ? result.ladder_map : null;
  let levels = 6;
  if (ladder_map && ladder_map.length > 0) {
    levels = Math.max(...ladder_map.map(r => Number(r.row || r['row'] || 0)));
  }
  const topY = 60;
  const bottomY = 260;
  const levelStep = (bottomY - topY) / (levels + 1);

  // build connections grid
  const connections = Array.from({ length: levels }).map(() => Array(columns - 1).fill(false));
  if (ladder_map && ladder_map.length > 0) {
    ladder_map.forEach(item => {
      const row = Number(item.row || item['row'] || 0);
      const col = Number(item.column || item['column'] || 0);
      if (row >= 1 && col >= 1 && col <= columns - 1 && row <= levels) {
        connections[row - 1][col - 1] = true;
      }
    });
  } else {
    // fallback generation using seed from taskId + participants.length
    function seededRandom(seed) {
      let t = seed >>> 0;
      return function() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r = (r + Math.imul(r ^ (r >>> 7), r | 61)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    }
    const seed = (Number(result.taskId || 0) || 1) + (participants.length << 8);
    const rand = seededRandom(seed);
    for (let lvl = 0; lvl < levels; lvl++) {
      let prev = false;
      for (let i = 0; i < columns - 1; i++) {
        if (prev) { prev = false; continue; }
        if (rand() < 0.28) { connections[lvl][i] = true; prev = true; }
      }
    }
  }

  // build path commands by simulating from a center start (same as before) so animation still works
  function simulateFromStart(startIdx) {
    let cur = startIdx;
    for (let lvl = 0; lvl < levels; lvl++) {
      if (connections[lvl][cur]) { cur = cur + 1; continue; }
      if (cur - 1 >= 0 && connections[lvl][cur - 1]) { cur = cur - 1; continue; }
    }
    return cur;
  }

  const startIndex = Math.floor((columns - 1) / 2);
  let curIndex = startIndex;
  const cmds = [];
  let curY = topY - levelStep;
  cmds.push(`M ${xPositions[curIndex]} ${curY}`);

  for (let lvl = 0; lvl < levels; lvl++) {
    const nextY = Math.round(topY + (lvl + 1) * levelStep);
    cmds.push(`L ${xPositions[curIndex]} ${nextY}`);
    if (connections[lvl][curIndex]) {
      curIndex = curIndex + 1;
      cmds.push(`L ${xPositions[curIndex]} ${nextY}`);
    } else if (curIndex - 1 >= 0 && connections[lvl][curIndex - 1]) {
      curIndex = curIndex - 1;
      cmds.push(`L ${xPositions[curIndex]} ${nextY}`);
    }
    curY = nextY;
  }
  cmds.push(`L ${xPositions[curIndex]} ${bottomY}`);
  const chosenPath = cmds.join('\n');

  // bottom_result from server or fallback: if server provided, use it; else pick assigned index if present
  let bottom_result = Array(columns).fill('꽝');
  if (Array.isArray(result.bottom_result) && result.bottom_result.length === columns) {
    bottom_result = result.bottom_result.slice();
  } else if (typeof result.assigned_to !== 'undefined' && result.assigned_to !== null) {
    const aid = Number(result.assigned_to);
    const idx = participants.findIndex(p => Number(p.user_id) === aid);
    if (idx >= 0) bottom_result[idx] = '당첨';
  } else if (Array.isArray(result.result_map) && Object.keys(result.result_map).length > 0) {
    try {
      const end = Number(result.result_map['1'] || result.result_map[1]);
      if (!Number.isNaN(end) && end >= 1 && end <= columns) bottom_result[end - 1] = '당첨';
    } catch (e) {}
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', zIndex: 4000 }}>
      <div style={{ width: 420, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <h3 style={{ marginBottom: 8, textAlign: 'center' }}>사다리 결과</h3>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>

            {/* participant names above columns */}
            {xPositions.map((x, i) => (
              <text key={`p-${i}`} x={x} y={24} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: '#222' }}>{participants[i]?.user_name || `참여자 ${i+1}`}</text>
            ))}

            {/* vertical rails */}
            {xPositions.map((x, i) => (
              <line key={`rail-${i}`} x1={x} y1={topY - 8} x2={x} y2={bottomY + 8} stroke="#d0d5d9" strokeWidth={4} strokeLinecap="round" />
            ))}

            {/* rungs from connections */}
            {connections.map((row, lvl) => (
              row.map((conn, i) => {
                if (!conn) return null;
                const y = Math.round(topY + (lvl + 1) * levelStep);
                const x1 = xPositions[i];
                const x2 = xPositions[i + 1];
                return <line key={`rung-${lvl}-${i}`} x1={x1} y1={y} x2={x2} y2={y} stroke="#e6e6e6" strokeWidth={2} />;
              })
            ))}

            {/* path and marker */}
            <path ref={pathRef} d={chosenPath} fill="none" stroke="#DF6437" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <circle ref={markerRef} cx={xPositions[startIndex]} cy={topY} r={10} fill="#DF6437" />

            {/* bottom badges */}
            {xPositions.map((x, i) => {
              const y = bottomY + 32;
              const val = bottom_result[i] || '꽝';
              if (val === '당첨') {
                return (
                  <g key={`badge-${i}`}>
                    <rect x={x - 30} y={y - 18} width={60} height={24} rx={6} fill="#DF6437" />
                    <text x={x} y={y - 2} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: '#fff' }}>당첨</text>
                  </g>
                );
              }
              return (
                <text key={`loser-${i}`} x={x} y={y - 2} textAnchor="middle" style={{ fontSize: 12, fill: '#888' }}>꽝</text>
              );
            })}

          </svg>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{ fontWeight: 700 }}>{(() => {
            const winIdx = bottom_result.findIndex(v => v === '당첨');
            if (winIdx >= 0) return participants[winIdx]?.user_name || `참여자 ${winIdx+1}`;
            return result.assigned_to || result.winner?.user_name || '당첨자';
          })()}</div>
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
