import axiosInstance, { USE_MOCK } from "./axiosInstance";
import { db, counters } from "../mocks/db";

// Ensure there is at least one default group in mock DB for developer convenience
function ensureDefaultGroup() {
  if (db.groups.length === 0) {
    db.groups.push({
      group_id: counters.groupId++,
      group_name: "우리집",
      members: [],
    });
  }
}

function getCurrentUserFromStorage() {
  if (typeof window === 'undefined') return { userId: null, token: null };
  let userId = null;
  let token = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.user_id) userId = String(u.user_id);
      if (u?.token) token = String(u.token);
    }
  } catch (e) {}
  if (!userId) userId = localStorage.getItem('user_id') || localStorage.getItem('userId') || null;
  if (!token) token = localStorage.getItem('token') || null;
  return { userId, token };
}

export const fetchMyGroups = async () => {
  ensureDefaultGroup();

  const { userId, token } = getCurrentUserFromStorage();

  if (USE_MOCK) {
    if (!userId) return Promise.resolve([]);
    // return only groups where the current user is a member, include members and simplified role
    const result = (db.groups || [])
      .filter((g) => Array.isArray(g.members) && g.members.some((m) => String(m.user_id) === String(userId)))
      .map((g) => ({
        group_id: g.group_id,
        group_name: g.group_name,
        members: g.members || [],
        role: g.role ?? (g.members.find((m) => String(m.user_id) === String(userId))?.role || null),
      }));
    console.log('fetchMyGroups (mock) returning', result);
    return Promise.resolve(result);
  }

  try {
    const res = await axiosInstance.get("/groups");
    return res.data;
  } catch (e) {
    console.warn(
      "fetchMyGroups failed, returning mock groups from db as fallback",
      e?.message || e
    );
    ensureDefaultGroup();
    return db.groups.map((g) => ({ group_id: g.group_id, group_name: g.group_name }));
  }
};

export const fetchGroupById = async (groupId) => {
  if (USE_MOCK) {
    const g = db.groups.find((gr) => gr.group_id === Number(groupId));
    return Promise.resolve(g || null);
  }

  try {
    const res = await axiosInstance.get(`/groups/${groupId}`);
    return res.data;
  } catch (e) {
    console.warn(
      "fetchGroupById failed, returning mock group from db as fallback",
      e?.message || e
    );
    const g = db.groups.find((gr) => gr.group_id === Number(groupId));
    return g || null;
  }
};

export const createGroup = async (payload) => {
  if (USE_MOCK) {
    const newGroup = {
      group_id: counters.groupId++,
      group_name: payload.group_name,
      members: payload.members || [],
    };
    db.groups.push(newGroup);
    return Promise.resolve(newGroup);
  }

  try {
    const { token, userId } = getCurrentUserFromStorage();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    else if (userId) headers["x-user-id"] = String(userId);

    const res = await axiosInstance.post("/groups", payload, { headers });
    return res.data;
  } catch (e) {
    console.warn(
      "createGroup failed, creating in mock db as fallback",
      e?.message || e
    );
    const newGroup = {
      group_id: counters.groupId++,
      group_name: payload.group_name,
      members: payload.members || [],
    };
    db.groups.push(newGroup);
    return newGroup;
  }
};

export const leaveGroup = async (groupId, userId) => {
  if (USE_MOCK) {
    const g = (db.groups || []).find((gr) => Number(gr.group_id) === Number(groupId));
    if (!g) return Promise.reject(new Error("group_not_found"));
    g.members = (g.members || []).filter((m) => Number(m.user_id) !== Number(userId));
    return Promise.resolve({ success: true });
  }

  try {
    // determine token or current user from localStorage (do not rely on external helper)
    let token = null;
    let curUserId = null;
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.token) token = String(u.token);
        if (u?.user_id) curUserId = String(u.user_id);
      }
    } catch (e) {}
    if (!curUserId) curUserId = localStorage.getItem("user_id") || localStorage.getItem("userId") || null;

    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    else if (curUserId) headers["x-user-id"] = String(curUserId);

    const res = await axiosInstance.delete(`/groups/${groupId}/members/${userId}`, { headers });
    return res.data;
  } catch (e) {
    console.error("leaveGroup failed", e);
    throw e;
  }
};
