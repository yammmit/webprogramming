import api from './axiosInstance';

export async function fetchUsersByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const q = ids.join(',');
  const res = await api.get(`/users?ids=${encodeURIComponent(q)}`);
  return res.data?.users || res.data || [];
}
