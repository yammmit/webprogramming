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

export const fetchMyGroups = async () => {
  if (USE_MOCK) {
    ensureDefaultGroup();
    // For list view, return simplified objects (group_id, group_name)
    return Promise.resolve(
      db.groups.map((g) => ({ group_id: g.group_id, group_name: g.group_name }))
    );
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
      members: [],
    };
    db.groups.push(newGroup);
    return Promise.resolve(newGroup);
  }

  try {
    const res = await axiosInstance.post("/groups", payload);
    return res.data;
  } catch (e) {
    console.warn(
      "createGroup failed, creating in mock db as fallback",
      e?.message || e
    );
    const newGroup = {
      group_id: counters.groupId++,
      group_name: payload.group_name,
      members: [],
    };
    db.groups.push(newGroup);
    return newGroup;
  }
};
