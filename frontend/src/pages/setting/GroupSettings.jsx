import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';

export default function GroupSettings() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div style={{ padding: 0 }}>
        <div style={{ background: '#DF6437', padding: '12px 16px', color: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 6px 18px rgba(223,100,55,0.12)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} aria-label="뒤로가기" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
            <h2 style={{ margin: 0, fontSize: 20, flex: 1, textAlign: 'center' }}>그룹 설정</h2>
            <div style={{ width: 28 }} />
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 6px 18px rgba(0,0,0,0.06)', marginTop: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>그룹 관리</div>

              <button onClick={() => navigate('/settings/groups/create')} style={{ display: 'flex', width: '100%', padding: 16, alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <div style={{ fontSize: 16 }}>그룹 생성</div>
                <div style={{ color: '#999' }}>{'>'}</div>
              </button>

              <hr style={{ margin: 0, border: 'none', borderTop: '1px solid #f0f0f0' }} />

              <button onClick={() => navigate('/settings/groups/manage')} style={{ display: 'flex', width: '100%', padding: 16, alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <div style={{ fontSize: 16 }}>기존 그룹 관리</div>
                <div style={{ color: '#999' }}>{'>'}</div>
              </button>

            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
