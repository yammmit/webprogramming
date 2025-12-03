import React, { useEffect, useRef, useState } from 'react';

export default function LadderResultModal({ visible, result, onClose, onViewTask }) {
  const pathRef = useRef(null);
  const markerRef = useRef(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!visible || !result) return;
    const pathEl = pathRef.current;
    const markerEl = markerRef.current;
    if (!pathEl || !markerEl) return;

    const total = pathEl.getTotalLength();
    // prepare stroke animation
    pathEl.style.strokeDasharray = total;
    pathEl.style.strokeDashoffset = total;
    pathEl.style.transition = 'stroke-dashoffset 1.6s ease-in-out';

    const duration = 1600; // ms
    let start = null;
    setAnimating(true);

    // animate stroke
    requestAnimationFrame(() => {
      // start drawing
      pathEl.style.strokeDashoffset = '0';
    });

    // animate marker along path using requestAnimationFrame
    function step(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / duration);
      const drawLen = total * t;
      const pt = pathEl.getPointAtLength(drawLen);
      markerEl.setAttribute('cx', pt.x);
      markerEl.setAttribute('cy', pt.y);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        setAnimating(false);
      }
    }
    requestAnimationFrame(step);

    return () => {
      // reset
      try {
        pathEl.style.transition = '';
        pathEl.style.strokeDashoffset = '';
        pathEl.style.strokeDasharray = '';
      } catch (e) {}
      setAnimating(false);
    };
  }, [visible, result]);

  if (!visible || !result) return null;

  // Determine number of columns from result.total_members (fallback to 3)
  const columns = Math.max(1, Number(result.total_members || 3));

  // choose winner index deterministically from winner id (fallback to 0)
  const winnerIndex = (() => {
    const id = Number(result.winner?.user_id || result.winner?.id || 0);
    if (!id || Number.isNaN(id)) return 0;
    return Math.abs(id) % columns;
  })();

  // SVG layout
  const width = 360;
  const height = 300;
  const leftPad = 40;
  const rightPad = 40;
  const usable = width - leftPad - rightPad;
  const xPositions = Array.from({ length: columns }).map((_, i) => Math.round(leftPad + (usable * i) / Math.max(columns - 1, 1)));

  // Build random horizontal connections per level (seeded for reproducibility)
  const levels = 6;
  const topY = 40;
  const bottomY = 240;
  const levelStep = (bottomY - topY) / levels;

  // seeded RNG (mulberry32)
  function seededRandom(seed) {
    let t = seed >>> 0;
    return function() {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), r | 61)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  // seed must NOT include winner id so layout remains identical before/after assignment
  const seedBase = (Number(result.taskId || 0) || 1) + ((Number(result.total_members || 0) & 0xff) << 8);
  const rand = seededRandom(seedBase);

  // connections[level][index] -> connection between column index and index+1 at that level
  const connections = Array.from({ length: levels }).map(() => Array(columns - 1).fill(false));
  for (let lvl = 0; lvl < levels; lvl++) {
    let prev = false;
    for (let i = 0; i < columns - 1; i++) {
      // avoid adjacent horizontal connections
      if (prev) { prev = false; continue; }
      const p = rand();
      // 30% chance to place a horizontal rung
      if (p < 0.3) {
        connections[lvl][i] = true;
        prev = true;
      }
    }
  }

  // simulate mapping from start to end given connections
  function simulateFromStart(startIdx) {
    let cur = startIdx;
    for (let lvl = 0; lvl < levels; lvl++) {
      // if connection to right exists at cur, move right
      if (connections[lvl][cur]) { cur = cur + 1; continue; }
      // if connection to left exists at cur-1, move left
      if (cur - 1 >= 0 && connections[lvl][cur - 1]) { cur = cur - 1; continue; }
      // otherwise stay
    }
    return cur;
  }

  const startIndex = Math.floor((columns - 1) / 2);
  let endIdx = simulateFromStart(startIndex);

  // if endIdx doesn't match winnerIndex, try to add connections near bottom to guide to winner
  if (endIdx !== winnerIndex) {
    // try from bottom up to adjust
    for (let lvl = levels - 1; lvl >= 0 && endIdx !== winnerIndex; lvl--) {
      if (endIdx < winnerIndex) {
        // need to move right: add connection at index = endIdx if safe
        if (endIdx < columns - 1 && !connections[lvl][endIdx] && !((endIdx - 1 >= 0) && connections[lvl][endIdx - 1]) && !((endIdx + 1 < columns - 1) && connections[lvl][endIdx + 1])) {
          connections[lvl][endIdx] = true;
          endIdx = simulateFromStart(startIndex);
        }
      } else {
        // need to move left: add connection at index = endIdx-1 if safe
        const idx = endIdx - 1;
        if (idx >= 0 && !connections[lvl][idx] && !((idx - 1 >= 0) && connections[lvl][idx - 1]) && !((idx + 1 < columns - 1) && connections[lvl][idx + 1])) {
          connections[lvl][idx] = true;
          endIdx = simulateFromStart(startIndex);
        }
      }
    }
  }

  // Build path commands following the ladder connections
  const cmds = [];
  let curIndex = startIndex;
  let curY = topY;
  cmds.push(`M ${xPositions[curIndex]} ${curY}`);

  for (let lvl = 0; lvl < levels; lvl++) {
    const nextY = Math.round(topY + (lvl + 1) * levelStep);
    // move down to nextY
    cmds.push(`L ${xPositions[curIndex]} ${nextY}`);
    // check horizontal moves at this level
    if (connections[lvl][curIndex]) {
      // move right
      curIndex = curIndex + 1;
      cmds.push(`L ${xPositions[curIndex]} ${nextY}`);
    } else if (curIndex - 1 >= 0 && connections[lvl][curIndex - 1]) {
      // move left
      curIndex = curIndex - 1;
      cmds.push(`L ${xPositions[curIndex]} ${nextY}`);
    }
    curY = nextY;
  }

  // ensure final down to bottomY
  cmds.push(`L ${xPositions[curIndex]} ${bottomY}`);
  const chosenPath = cmds.join('\n');

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', zIndex: 4000 }}>
      <div style={{ width: 360, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <h3 style={{ marginBottom: 8, textAlign: 'center' }}>사다리 결과</h3>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* vertical rails */}
            {xPositions.map((x, i) => (
              <line key={i} x1={x} y1={20} x2={x} y2={260} stroke="#d0d5d9" strokeWidth={4} strokeLinecap="round" />
            ))}

            {/* rungs (simple decorative lines) */}
            {connections.map((row, lvl) => (
              row.map((conn, i) => {
                if (!conn) return null;
                const y = Math.round(topY + (lvl + 1) * levelStep);
                const x1 = xPositions[i];
                const x2 = xPositions[i + 1];
                return <line key={`rung-${lvl}-${i}`} x1={x1} y1={y} x2={x2} y2={y} stroke="#e6e6e6" strokeWidth={2} />;
              })
            ))}

            {/* animated path */}
            <path ref={pathRef} d={chosenPath} fill="none" stroke="#DF6437" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />

            {/* marker */}
            <circle ref={markerRef} cx={xPositions[1]} cy={40} r={10} fill="#DF6437" />
          </svg>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{ fontWeight: 700 }}>{result.winner?.name || result.winner?.id || '당첨자'}</div>
          <div style={{ color: '#666', marginTop: 6 }}>{animating ? '사다리 진행중...' : '배정 완료'}</div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #DF6437', color: '#DF6437' }}>닫기</button>
        </div>
      </div>
    </div>
  );
}
