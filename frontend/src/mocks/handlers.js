import { rest } from 'msw';
import { db, counters } from './db';

export const handlers = [
  // return list of groups (id + name)
  rest.get('/groups', (req, res, ctx) => {
    const result = (db.groups || []).map(g => ({ group_id: g.group_id, group_name: g.group_name }));
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
];
