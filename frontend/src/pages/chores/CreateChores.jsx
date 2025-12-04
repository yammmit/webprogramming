import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChoreLayout from '../../components/layout/ChoresLayout';
import StarRating from '../../components/ui/StarRating';
import api from '../../api/axiosInstance';

export default function CreateChores() {
  const navigate = useNavigate();

  const getInitialGroupId = () => {
    if (typeof window !== 'undefined') {
      const cur = localStorage.getItem('currentGroupId') || localStorage.getItem('group_id');
      if (cur) return Number(cur);
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          if (u?.group_id) return Number(u.group_id);
        }
      } catch (e) {
        // ignore
      }
    }
    return 10;
  };

  const [groupId, setGroupId] = useState(getInitialGroupId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyType, setFrequencyType] = useState('weekly'); // none, daily, weekly, biweekly, monthly, yearly
  const [weekdayMask, setWeekdayMask] = useState(16); // default to sample friday (16)
  const [difficulty, setDifficulty] = useState(3);

  const weekdayLabels = ['월','화','수','목','금','토','일'];
  const weekdayValues = [1,2,4,8,16,32,64];

  function toggleWeekday(idx) {
    const bit = weekdayValues[idx];
    setWeekdayMask((prev) => (prev & bit) ? (prev & ~bit) : (prev | bit));
  }

  function clearForm() {
    setTitle('');
    setDescription('');
    setFrequencyType('weekly');
    setWeekdayMask(16);
    setDifficulty(3);
  }

  function handleSave() {
    if (!title.trim()) return alert('제목을 입력하세요.');

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      difficulty: Number(difficulty) || 1,
      frequency_type: frequencyType,
      weekday_mask: frequencyType === 'none' ? null : (weekdayMask || null),
    };

    // call API via shared axios instance so requests go to backend
    (async () => {
      try {
        const res = await api.post(`/groups/${groupId}/tasks`, payload);
        if (res.status === 201 || res.status === 200) {
          alert('저장되었습니다.');
          navigate(`/main/chores/${groupId}`);
        } else {
          console.error('create task failed', res.data);
          alert('저장에 실패했습니다.');
        }
      } catch (e) {
        console.error('create task error', e);
        alert(e.response?.data?.error || '네트워크 에러');
      }
    })();
  }

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'currentGroupId' || e.key === 'group_id') {
        setGroupId(getInitialGroupId());
      }
    }
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
  }, []);

  return (
    <ChoreLayout>
      <div style={{ padding: 0, minHeight: '100vh' }}>
        <div style={{ background: '#DF6437', height: 160, display: 'flex', alignItems: 'center', paddingLeft: 24 }}>
          <h1 style={{ color: '#fff', fontSize: 36, margin: 0 }}>집안일 등록하기</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', marginTop: -32, padding: 20, boxShadow: '0 -8px 30px rgba(0,0,0,0.06)', minHeight: 'calc(100vh - 160px)' }}>
          <div style={{ width: 48, height: 6, background: '#e6e6e6', borderRadius: 4, margin: '0 auto 12px' }} />

          <div style={{ display: 'grid', gap: 18 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 80, color: '#DF6437', fontWeight: 700 }}>집안일</div>
                <input
                  value={title}
                  onChange={(e)=>setTitle(e.target.value.slice(0,30))}
                  placeholder="집안일 이름을 입력하세요"
                  maxLength={30}
                  style={{ flex: 1, minWidth: 0, border: 'none', borderBottom: '1px solid #cfcfcf', padding: '8px 6px', fontSize: 16 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', color: '#999', fontSize: 12 }}>남은 글자 {30 - title.length}</div>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 80, color: '#DF6437', fontWeight: 700 }}>주기</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['daily','weekly','biweekly','monthly','none'].map((t)=> (
                  <button key={t} onClick={()=>setFrequencyType(t)} style={{ padding: '8px 12px', borderRadius: 20, border: `1px solid ${frequencyType===t? '#DF6437':'#D6D6D6'}`, background: frequencyType===t? '#fff':'transparent' }}>{t==='none'?'한번': t==='daily'?'매일': t==='weekly'?'1주': t==='biweekly'?'2주':'한달'}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 80, color: '#DF6437', fontWeight: 700 }}>요일</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {weekdayLabels.map((label, idx)=> {
                  const active = !!(weekdayMask & weekdayValues[idx]);
                  return (
                    <button key={label} onClick={()=>toggleWeekday(idx)} style={{ padding: '8px 12px', borderRadius: 20, border: `1px solid ${active? '#DF6437':'#D6D6D6'}`, background: active? '#fff':'transparent' }}>{label}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 80, color: '#DF6437', fontWeight: 700 }}>난이도</div>
              <div>
                <StarRating value={difficulty} editable={true} onChange={(v) => setDifficulty(v)} />
              </div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 80, color: '#DF6437', fontWeight: 700 }}>설명</div>
                <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="설명을 입력하세요" rows={3} style={{ flex: 1, minWidth: 0, border: 'none', borderBottom: '1px solid #cfcfcf', padding: '8px 6px', fontSize: 16, resize: 'vertical' }} />
              </div>
            </label>

          </div>

          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20, display: 'flex', gap: 12 }}>
            <button onClick={()=>{ clearForm(); navigate(-1); }} style={{ flex: 1, padding: '16px 20px', borderRadius: 12, border: '1px solid #DF6437', background: '#fff', color: '#DF6437', fontWeight: 700 }}>취소하기</button>
            <button onClick={handleSave} style={{ flex: 1, padding: '16px 20px', borderRadius: 12, border: 'none', background: '#DF6437', color: '#fff', fontWeight: 700 }}>등록하기</button>
          </div>

        </div>
      </div>
    </ChoreLayout>
  );
}
