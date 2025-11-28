// 🗄️ 모든 Mock 데이터베이스 (메모리 기반)
// 다양한 상태의 데이터로 테스트하기 쉬우도록 구성합니다.
export const db = {
  users: [
    { user_id: 1, email: "user1@example.com", password: "pw1", user_name: "홍길동" },
    { user_id: 2, email: "tester@example.com", password: "pw", user_name: "테스터" },
    { user_id: 3, email: "user3@example.com", password: "pw3", user_name: "이영희" },
    { user_id: 4, email: "user4@example.com", password: "pw4", user_name: "수빈" }
  ],

  groups: [
    {
      group_id: 10,
      group_name: "우리집",
      members: [
        { user_id: 1, user_name: "홍길동", role: "owner", joined_at: "2025-11-01T10:00:00Z" },
        { user_id: 2, user_name: "테스터", role: "member", joined_at: "2025-11-02T10:00:00Z" },
        { user_id: 3, user_name: "이영희", role: "member", joined_at: "2025-11-03T10:00:00Z" }
      ]
    },
    {
      group_id: 11,
      group_name: "동기넷",
      members: [
        { user_id: 1, user_name: "홍길동", role: "owner", joined_at: "2025-11-28T12:00:00Z" },
        { user_id: 4, user_name: "수빈", role: "member", joined_at: "2025-11-25T10:00:00Z" }
      ]
    }
  ],

  // tasks: 다양한 상태 혼합(미배정, 배정, 완료)
  tasks: [
    // completed, assigned to user 2, already evaluated by user 2 (should not show in review for user 2)
    {
      task_id: 55,
      group_id: 10,
      title: "바닥 닦기",
      difficulty: 3,
      assigned_to: 2,
      status: "completed",
      created_at: "2025-11-01T09:00:00Z",
      reviews: [
        { task_evaluation_id: 300, assignment_id: 200, evaluator_id: 2, rating: 5, comment: "완벽해요", is_anonymous: false, created_at: "2025-11-26T16:00:00Z", user_id: 2 }
      ]
    },

    // completed, assigned to user 3, evaluated by user 1 (so user 2 hasn't evaluated)
    {
      task_id: 56,
      group_id: 10,
      title: "설거지",
      difficulty: 2,
      assigned_to: 3,
      status: "completed",
      created_at: "2025-11-02T09:00:00Z",
      reviews: [
        { task_evaluation_id: 301, assignment_id: 201, evaluator_id: 1, rating: 4, comment: "잘했어요", is_anonymous: false, created_at: "2025-11-25T10:00:00Z", user_id: 1 }
      ]
    },

    // completed, assigned to user 1, no evaluations yet (should appear in review for others)
    {
      task_id: 57,
      group_id: 10,
      title: "빨래",
      difficulty: 1,
      assigned_to: 1,
      status: "completed",
      created_at: "2025-10-28T07:30:00Z",
      reviews: []
    },

    // assigned but not completed (inProgress)
    {
      task_id: 58,
      group_id: 10,
      title: "청소기 돌리기",
      difficulty: 2,
      assigned_to: 3,
      status: "assigned",
      created_at: "2025-11-03T12:00:00Z",
      reviews: []
    },

    // unassigned task
    {
      task_id: 59,
      group_id: 10,
      title: "음식물 쓰레기 버리기",
      difficulty: 1,
      assigned_to: null,
      status: "assigned",
      created_at: "2025-11-04T08:00:00Z",
      reviews: []
    },

    // completed, assigned to user 4, evaluated anonymously (evaluator_id null)
    {
      task_id: 60,
      group_id: 10,
      title: "화장실 청소",
      difficulty: 5,
      assigned_to: 4,
      status: "completed",
      created_at: "2025-11-05T11:00:00Z",
      reviews: [
        { task_evaluation_id: 302, assignment_id: 203, evaluator_id: null, rating: 5, comment: "깔끔해요", is_anonymous: true, created_at: "2025-11-26T16:00:00Z", user_id: null }
      ]
    }
  ],

  // taskHistory: 완료 기록
  taskHistory: [
    { task_completion_id: 501, assignment_id: 200, task_id: 55, completed_at: "2025-11-21T09:00:00Z", completed_by: 2 },
    { task_completion_id: 502, assignment_id: 201, task_id: 56, completed_at: "2025-11-20T10:30:00Z", completed_by: 3 }
  ],

  // evaluations: global list (backend-like naming) — keep duplicates for frontend convenience
  evaluations: [
    // evaluator 2 reviewed task 55
    {
      task_evaluation_id: 300,
      assignment_id: 200,
      evaluator_id: 2,
      rating: 5,
      comment: "완벽해요",
      is_anonymous: false,
      created_at: "2025-11-26T16:00:00Z",
      user_id: 2,
      task_id: 55
    },
    // evaluator 1 reviewed task 56
    {
      task_evaluation_id: 301,
      assignment_id: 201,
      evaluator_id: 1,
      rating: 4,
      comment: "잘했어요",
      is_anonymous: false,
      created_at: "2025-11-25T10:00:00Z",
      user_id: 1,
      task_id: 56
    },
    // anonymous review for task 60
    {
      task_evaluation_id: 302,
      assignment_id: 203,
      evaluator_id: null,
      rating: 5,
      comment: "깔끔해요",
      is_anonymous: true,
      created_at: "2025-11-26T16:00:00Z",
      user_id: null,
      task_id: 60
    }
  ],

  // reviews alias kept for older front-end checks
  reviews: [
    // duplicate entries from evaluations for backward compatibility
    { task_evaluation_id: 300, assignment_id: 200, evaluator_id: 2, user_id: 2, task_id: 55 },
    { task_evaluation_id: 301, assignment_id: 201, evaluator_id: 1, user_id: 1, task_id: 56 },
    { task_evaluation_id: 302, assignment_id: 203, evaluator_id: null, user_id: null, task_id: 60 }
  ]
};

export let counters = {
  userId: 5,
  groupId: 12,
  invitationId: 34,
  taskId: 60,
  assignmentId: 203,
  evaluationId: 302,
  completionId: 502
};
