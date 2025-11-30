import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';

export default function CreateGroup() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  async function handleCreate() {
    if (!name.trim()) return alert('그룹 이름을 입력하세요');
    try {
      const res = await fetch('/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_name: name.trim() }) });
      if (res.status === 201) {
        const data = await res.json();
        // set newly selected group
        if (typeof window !== 'undefined' && data?.group_id) localStorage.setItem('currentGroupId', String(data.group_id));
        alert('그룹이 생성되었습니다');
        navigate('/settings');
      } else {
        alert('그룹 생성에 실패했습니다');
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
          <div style={{ maxWidth: 640, margin: '0 auto' }}><h2 style={{ margin: 0, fontSize: 20 }}>그룹 생성</h2></div>
        </div>

        <div style={{ background: '#fff', padding: 16, marginTop: 12, borderRadius: 8 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>그룹명</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="그룹명을 입력하세요" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e6e6e6' }} />
          </label>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => navigate(-1)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #DF6437', background: '#fff', color: '#DF6437' }}>취소</button>
            <button onClick={handleCreate} style={{ padding: '10px 12px', borderRadius: 8, border: 'none', background: '#DF6437', color: '#fff' }}>생성</button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
