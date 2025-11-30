import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../api/axiosInstance';

export default function MyInvitation() {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  async function loadInvitations() {
    setLoading(true);
    try {
      const res = await api.get('/invitations');
      // expect array
      const data = Array.isArray(res.data) ? res.data : (res.data?.invitations && Array.isArray(res.data.invitations) ? res.data.invitations : []);
      setInvitations(data);
    } catch (err) {
      console.error('failed to load invitations', err);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvitations();
  }, []);

  async function handleAccept(invId) {
    if (!confirm('초대를 수락하시겠습니까?')) return;
    setProcessingId(invId);
    try {
      await api.post(`/invitations/${invId}/accept`);
      await loadInvitations();
      alert('수락되었습니다');
    } catch (err) {
      console.error('accept failed', err);
      alert(err.response?.data?.error || '수락에 실패했습니다');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDecline(invId) {
    if (!confirm('초대를 거절하시겠습니까?')) return;
    setProcessingId(invId);
    try {
      await api.delete(`/invitations/${invId}`);
      await loadInvitations();
      alert('거절(삭제)되었습니다');
    } catch (err) {
      console.error('decline failed', err);
      alert(err.response?.data?.error || '거절에 실패했습니다');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
        <div style={{ background: '#DF6437', padding: '12px 16px', color: '#fff', borderRadius: '0 0 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
            <h2 style={{ margin: '0 auto', fontSize: 18 }}>내 초대함</h2>
            <div style={{ width: 28 }} />
          </div>
        </div>

        <div style={{ background: '#fff', marginTop: 12, borderRadius: 8, padding: 12 }}>
          {loading ? (
            <div>로딩중...</div>
          ) : invitations.length === 0 ? (
            <div style={{ color: '#666' }}>받은 초대가 없습니다</div>
          ) : (
            <div>
              {invitations.map(inv => (
                <div key={inv.invitation_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 8px', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{inv.group_name || `그룹 ${inv.group_id}`}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>보낸이: {inv.invited_by?.user_name ? inv.invited_by.user_name : (inv.invited_by?.user_id || '')}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{new Date(inv.created_at).toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button disabled={processingId === inv.invitation_id} onClick={() => handleAccept(inv.invitation_id)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#28a745', color: '#fff' }}>수락</button>
                    <button disabled={processingId === inv.invitation_id} onClick={() => handleDecline(inv.invitation_id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ccc', background: '#fff' }}>거절</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
