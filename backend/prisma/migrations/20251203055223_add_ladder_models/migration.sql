-- CreateTable
CREATE TABLE `LadderResult` (
    `ladder_id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER NOT NULL,
    `group_id` INTEGER NOT NULL,
    `participants` JSON NOT NULL,
    `ladder_map` JSON NOT NULL,
    `result_map` JSON NOT NULL,
    `assigned_to` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LadderResult_task_id_idx`(`task_id`),
    PRIMARY KEY (`ladder_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `LadderVote_task_id_idx` ON `LadderVote`(`task_id`);
