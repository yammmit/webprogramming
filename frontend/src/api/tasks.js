import axiosInstance, { USE_MOCK } from './axiosInstance';
import { db, counters } from '../mocks/db';

export async function fetchTasksByGroup(groupId) {
  if (USE_MOCK) {
    const tasks = db.tasks.filter((t) => t.group_id === groupId);
    return Promise.resolve(tasks);
  }

  try {
    const res = await axiosInstance.get(`/groups/${groupId}/tasks`);
    console.log('fetchTasksByGroup raw response:', res.data);
    // normalize response shapes
    let tasks = [];
    const raw = res.data;
    if (Array.isArray(raw)) tasks = raw;
    else if (raw?.tasks && Array.isArray(raw.tasks)) tasks = raw.tasks;
    else if (raw?.data && Array.isArray(raw.data)) tasks = raw.data;
    else if (raw?.group?.tasks && Array.isArray(raw.group.tasks)) tasks = raw.group.tasks;
    else tasks = raw || [];
    return tasks;
  } catch (e) {
    console.warn('fetchTasksByGroup failed, returning mock tasks from db as fallback', e?.message || e);
    const tasks = db.tasks.filter((t) => t.group_id === groupId);
    return tasks;
  }
}
