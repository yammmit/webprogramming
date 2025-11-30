import { rest } from 'msw';
import { db, counters } from './db';

export const handlers = [
  // return list of groups (filter by current user membership)
  rest.get('/groups', (req, res, ctx) => {
    // determine user id from Authorization header or x-user-id
    let userId = null;
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    if (auth && typeof auth === 'string') {
      const m = auth.match(/mock-token-(\d+)/);
      if (m) userId = Number(m[1]);
    }
    const headerId = req.headers.get('x-user-id');
    if (!userId && headerId) userId = Number(headerId);

    if (!userId) {
      // no current user context -> return empty list (don't leak groups)
      return res(ctx.status(200), ctx.json([]));
    }

    const result = (db.groups || []).filter(g => Array.isArray(g.members) && g.members.some(m => Number(m.user_id) === Number(userId)))
      .map(g => ({
        group_id: g.group_id,
        group_name: g.group_name,
        members: g.members || [],
        role: (g.members || []).find(m => Number(m.user_id) === Number(userId))?.role || null
      }));

    return res(ctx.status(200), ctx.json(result));
  }),

  // return tasks for a group
  rest.get('/groups/:groupId/tasks', (req, res, ctx) => {
    const { groupId } = req.params;
    const tasks = (db.tasks || []).filter(t => String(t.group_id) === String(groupId));
    return res(ctx.status(200), ctx.json(tasks));
  }),

  // get single task
  rest.get('/tasks/:taskId', (req, res, ctx) => {
    const { taskId } = req.params;
    const task = (db.tasks || []).find(t => String(t.task_id) === String(taskId));
    if (!task) return res(ctx.status(404), ctx.json({ message: 'task_not_found' }));
    return res(ctx.status(200), ctx.json(task));
  }),

  // self-assign endpoint (mock implementation)
  rest.post('/tasks/:taskId/assign', async (req, res, ctx) => {
    const { taskId } = req.params;
    let body = {};
    try { body = await req.json(); } catch (e) { /* ignore */ }

    // determine current user id: accept body.user_id or header x-user-id
    const userIdFromHeader = req.headers.get('x-user-id');
    const currentUserId = body.user_id ?? (userIdFromHeader ? Number(userIdFromHeader) : null);

    const task = (db.tasks || []).find(t => String(t.task_id) === String(taskId));
    if (!task) return res(ctx.status(404), ctx.json({ message: 'task_not_found' }));

    // if already assigned, return 409
    if (task.assigned_to != null) {
      return res(ctx.status(409), ctx.json({ message: 'already_assigned', assigned_to: task.assigned_to }));
    }

    // perform assignment
    const newAssignmentId = ++counters.assignmentId;
    task.assigned_to = currentUserId != null ? Number(currentUserId) : null;
    task.status = 'assigned';

    const created_at = new Date().toISOString();

    // optionally push to a mock assignment/history list (omitted but could be added)

    return res(ctx.status(201), ctx.json({ task_assignment_id: newAssignmentId, assigned_to: task.assigned_to, status: task.status, created_at }));
  }),

  // create new task for group
  rest.post('/groups/:groupId/tasks', async (req, res, ctx) => {
    const { groupId } = req.params;
    let body = {};
    try { body = await req.json(); } catch (e) { /* ignore */ }

    // basic validation
    if (!body || !body.title) {
      return res(ctx.status(400), ctx.json({ message: 'invalid_payload' }));
    }

    const g = (db.groups || []).find(x => String(x.group_id) === String(groupId));
    if (!g) return res(ctx.status(404), ctx.json({ message: 'group_not_found' }));

    const newId = ++counters.taskId;
    const newTask = {
      task_id: newId,
      group_id: Number(groupId),
      title: String(body.title),
      description: body.description ?? null,
      difficulty: Number(body.difficulty ?? 1),
      frequency_type: body.frequency_type ?? null,
      weekday_mask: body.weekday_mask ?? null,
      assigned_to: null,
      status: 'assigned',
      created_at: new Date().toISOString(),
      reviews: []
    };

    db.tasks.push(newTask);

    return res(ctx.status(201), ctx.json({ task_id: newId }));
  }),

  // get single group detail (include members)
  rest.get('/groups/:groupId', (req, res, ctx) => {
    const { groupId } = req.params;
    const group = (db.groups || []).find(g => String(g.group_id) === String(groupId));
    if (!group) return res(ctx.status(404), ctx.json({ message: 'group_not_found' }));
    return res(ctx.status(200), ctx.json(group));
  }),

  // create a new group
  rest.post('/groups', async (req, res, ctx) => {
    let body = {};
    try { body = await req.json(); } catch (e) { }

    if (!body || !body.group_name) return res(ctx.status(400), ctx.json({ message: 'invalid_payload' }));

    const newId = ++counters.groupId;
    const newGroup = {
      group_id: newId,
      group_name: String(body.group_name),
      members: body.members || []
    };

    db.groups.push(newGroup);

    return res(ctx.status(201), ctx.json({ group_id: newId, group_name: newGroup.group_name, group_created_at: new Date().toISOString() }));
  }),

  // delete a group (owner-only responsibility in real API) -> remove group and its tasks
  rest.delete('/groups/:groupId', (req, res, ctx) => {
    const { groupId } = req.params;
    const idx = (db.groups || []).findIndex(g => String(g.group_id) === String(groupId));
    if (idx === -1) return res(ctx.status(404), ctx.json({ message: 'group_not_found' }));

    // remove group
    db.groups.splice(idx, 1);

    // remove tasks for that group
    db.tasks = (db.tasks || []).filter(t => String(t.group_id) !== String(groupId));

    return res(ctx.status(200), ctx.json({ message: 'group_deleted' }));
  }),

  // auth login (mock)
  rest.post('/auth/login', async (req, res, ctx) => {
    let body = {};
    try { body = await req.json(); } catch (e) { }

    const { email, password } = body || {};
    if (!email || !password) return res(ctx.status(400), ctx.json({ message: 'missing_credentials' }));

    const user = (db.users || []).find(u => u.email === email && u.password === password);
    if (!user) return res(ctx.status(401), ctx.json({ message: 'invalid_credentials' }));

    // build minimal user payload (omit password)
    const payload = { user_id: user.user_id, user_name: user.user_name, email: user.email };
    const token = `mock-token-${user.user_id}`;

    return res(ctx.status(200), ctx.json({ user: payload, token }));
  }),

  // remove a member from a group
  rest.delete('/groups/:groupId/members/:userId', (req, res, ctx) => {
    const { groupId, userId } = req.params;
    const g = (db.groups || []).find(gr => String(gr.group_id) === String(groupId));
    if (!g) return res(ctx.status(404), ctx.json({ message: 'group_not_found' }));
    const idx = (g.members || []).findIndex(m => String(m.user_id) === String(userId));
    if (idx === -1) return res(ctx.status(404), ctx.json({ message: 'member_not_found' }));
    g.members.splice(idx, 1);
    return res(ctx.status(200), ctx.json({ message: 'member_removed' }));
  }),
];
