-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_name" TEXT,
    "user_password" TEXT NOT NULL,
    "user_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_password_updated_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Group" (
    "group_id" SERIAL NOT NULL,
    "group_name" TEXT NOT NULL,
    "group_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "owner_id" INTEGER NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "group_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("group_id","user_id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "invitation_id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "invited_user_id" INTEGER NOT NULL,
    "invited_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("invitation_id")
);

-- CreateTable
CREATE TABLE "Task" (
    "task_id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" INTEGER NOT NULL,
    "frequency_type" TEXT NOT NULL,
    "weekday_mask" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "task_assignment_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "assigned_to" INTEGER,
    "assignment_type" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("task_assignment_id")
);

-- CreateTable
CREATE TABLE "TaskCompletion" (
    "task_completion_id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_by" INTEGER NOT NULL,

    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("task_completion_id")
);

-- CreateTable
CREATE TABLE "TaskEvaluation" (
    "task_evaluation_id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "evaluator_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "is_anonymous" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskEvaluation_pkey" PRIMARY KEY ("task_evaluation_id")
);

-- CreateTable
CREATE TABLE "LadderVote" (
    "ladder_vote_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vote" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LadderVote_pkey" PRIMARY KEY ("ladder_vote_id")
);

-- CreateTable
CREATE TABLE "LadderResult" (
    "ladder_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "participants" JSONB NOT NULL,
    "ladder_map" JSONB NOT NULL,
    "result_map" JSONB NOT NULL,
    "bottom_result" JSONB NOT NULL,
    "assigned_to" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LadderResult_pkey" PRIMARY KEY ("ladder_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_email_key" ON "User"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_assignment_id_key" ON "TaskCompletion"("assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "TaskEvaluation_assignment_id_evaluator_id_key" ON "TaskEvaluation"("assignment_id", "evaluator_id");

-- CreateIndex
CREATE INDEX "LadderVote_task_id_idx" ON "LadderVote"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "LadderVote_task_id_user_id_key" ON "LadderVote"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "LadderResult_task_id_idx" ON "LadderResult"("task_id");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invited_user_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "TaskAssignment"("task_assignment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvaluation" ADD CONSTRAINT "TaskEvaluation_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "TaskAssignment"("task_assignment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvaluation" ADD CONSTRAINT "TaskEvaluation_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
