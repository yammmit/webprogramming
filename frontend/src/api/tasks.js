import axiosInstance, { USE_MOCK } from './axiosInstance';
import { db, counters } from '../mocks/db';

export async function fetchTasksByGroup(groupId) {
  if (USE_MOCK) {
    const tasks = db.tasks.filter((t) => t.group_id === groupId);
    return Promise.resolve(tasks);
  }

  try {
    const res = await axiosInstance.get(`/groups/${groupId}/tasks`);
    return res.data;
  } catch (e) {
    console.warn('fetchTasksByGroup failed, returning mock tasks from db as fallback', e?.message || e);
    const tasks = db.tasks.filter((t) => t.group_id === groupId);
    return tasks;
  }
}
