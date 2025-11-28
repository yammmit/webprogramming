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
    {
      user_id: 3,
      user_email: "222",
      user_password: "222",
      user_name: "222",
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
    {
      task_id: 55,
      group_id: 10,
      title: "바닥 닦기",
      description: "주간 바닥 청소 — 물걸레로 바닥을 닦아주세요.",
      difficulty: 5,
      frequency_type: 'weekly',
      weekday_mask: 64, // e.g. Sunday=1 ... Saturday=64 (placeholder)
      created_at: '2025-11-01T10:00:00Z',
      assigned_to: 3,
      status: "assigned",
    },
    {
      task_id: 56,
      group_id: 10,
      title: "설거지",
      description: "식사 후 그릇과 식기를 설거지합니다.",
      difficulty: 2,
      frequency_type: 'daily',
      weekday_mask: null,
      created_at: '2025-11-02T09:00:00Z',
      assigned_to: 1,
      status: "assigned",
    },
    {
      task_id: 61,
      group_id: 10,
      title: "음쓰버리기",
      description: "음식물 쓰레기를 지정된 시간에 버려주세요.",
      difficulty: 1,
      frequency_type: 'daily',
      weekday_mask: null,
      created_at: '2025-11-03T08:00:00Z',
      assigned_to: null,
      status: "assigned",
    },
    {
      task_id: 62,
      group_id: 10,
      title: "화장실청소",
      description: "화장실 바닥과 변기를 청소합니다.",
      difficulty: 5,
      frequency_type: 'weekly',
      weekday_mask: 8,
      created_at: '2025-11-04T11:00:00Z',
      assigned_to: 1,
      status: "completed",
    },
    {
      task_id: 57,
      group_id: 10,
      title: "빨래",
      description: "세탁기를 돌리고 빨래를 널어주세요.",
      difficulty: 1,
      frequency_type: 'weekly',
      weekday_mask: 2,
      created_at: '2025-10-28T07:30:00Z',
      assigned_to: 1,
      status: "completed",
    },
    {
      task_id: 60,
      group_id: 12,
      title: "분리수거",
      description: "재활용품을 분리수거 통에 넣습니다.",
      difficulty: 1,
      frequency_type: 'weekly',
      weekday_mask: 32,
      created_at: '2025-11-05T12:00:00Z',
      assigned_to: null,
      status: "assigned",
    },
  ],

  taskHistory: [
    { task_completion_id: 501, assignment_id: 200, task_id: 57, completed_at: "2025-11-21T09:00:00Z", completed_by: 1 },
    { task_completion_id: 502, assignment_id: 201, task_id: 62, completed_at: "2025-11-20T10:30:00Z", completed_by: 4 },
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
    },{
      task_evaluation_id: 302,
      assignment_id: 200,
      evaluator_id: null,
      rating: 3,
      comment: "깔끔해요!",
      is_anonymous: true,
      created_at: "2025-11-26T16:00:00Z",
    },
    {
      task_evaluation_id: 301,
      assignment_id: 201,
      evaluator_id: 2,
      rating: 3,
      comment: "보통1이에요",
      is_anonymous: false,
      created_at: "2025-11-25T10:30:00Z",
    },
    {
      task_evaluation_id: 301,
      assignment_id: 201,
      evaluator_id: 2,
      rating: 1,
      comment: "보통2이에요",
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
