// 🗄️ 모든 Mock 데이터베이스 (메모리 기반)
export const db = {
  users: [
    {
      user_id: 1,
      email: "abc@example.com",
      password: "12345678",
      name: "홍길동",
    }
  ],
  groups: [],
  invitations: [],
  tasks: [],
  taskHistory: [],
  evaluations: [],
};

export let counters = {
  userId: 2,
  groupId: 10,
  invitationId: 33,
  taskId: 55,
  assignmentId: 200,
  evaluationId: 300,
  completionId: 500,
};
