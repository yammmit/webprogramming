// 🗄️ 모든 Mock 데이터베이스 (메모리 기반)
export const db = {
  users: [
    {
      user_id: 1,
      user_email: "abc@example.com",
      user_password: "123",
      user_name: "홍길동",
    },
    {
      user_id: 2,
      user_email: "tester@example.com",
      user_password: "pw",
      user_name: "테스터",
    },
  ],

  // 예시 그룹들 (members 포함)
  groups: [
    {
      group_id: 10,
      group_name: "우리집",
      members: [
        { user_id: 3, user_name: "123", role: "owner", joined_at: "2025-11-26T12:00:00Z" },
        
      ],
    },
    {
      group_id: 12,
      group_name: "동기넷",
      members: [
        { user_id: 2, user_name: "테스터", role: "owner", joined_at: "2025-11-27T10:00:00Z" },
      ],
    },
  ],

  invitations: [
    {
      invitation_id: 33,
      group_id: 10,
      invited_user_id: 3,
      invited_by: 1,
      status: "pending",
      created_at: "2025-11-26T12:00:00Z",
    },
  ],

  tasks: [
    { task_id: 55, group_id: 10, title: "바닥 닦기", difficulty: 3, assigned_to: 2, status: "assigned" },
    { task_id: 56, group_id: 10, title: "설거지", difficulty: 2, assigned_to: null, status: "assigned" },
    { task_id: 61, group_id: 10, title: "음쓰버리기", difficulty: 1, assigned_to: null, status: "assigned" },
    { task_id: 62, group_id: 10, title: "화장실청소", difficulty: 5, assigned_to: null, status: "assigned" },
    { task_id: 57, group_id: 10, title: "빨래", difficulty: 1, assigned_to: 1, status: "completed" },
    { task_id: 60, group_id: 12, title: "분리수거", difficulty: 1, assigned_to: null, status: "assigned" },
  ],

  taskHistory: [
    { task_completion_id: 501, assignment_id: 200, task_id: 57, completed_at: "2025-11-21T09:00:00Z", completed_by: 1 },
  ],

  evaluations: [
    {
      task_evaluation_id: 300,
      assignment_id: 200,
      evaluator_id: null,
      rating: 5,
      comment: "깔끔해요!",
      is_anonymous: true,
      created_at: "2025-11-26T16:00:00Z",
    },
    {
      task_evaluation_id: 301,
      assignment_id: 201,
      evaluator_id: 2,
      rating: 3,
      comment: "보통이에요",
      is_anonymous: false,
      created_at: "2025-11-25T10:30:00Z",
    },
  ],
};

export let counters = {
  userId: 3,
  groupId: 13,
  invitationId: 34,
  taskId: 61,
  assignmentId: 202,
  evaluationId: 302,
  completionId: 502,
};
