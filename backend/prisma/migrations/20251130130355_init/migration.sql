/*
  Warnings:

  - The primary key for the `Group` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `group_created_at` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `group_id` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `group_name` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `Group` table. All the data in the column will be lost.
  - The primary key for the `GroupMember` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `group_id` on the `GroupMember` table. All the data in the column will be lost.
  - You are about to drop the column `joined_at` on the `GroupMember` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `GroupMember` table. All the data in the column will be lost.
  - The primary key for the `Invitation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `group_id` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `invitation_id` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `invited_by` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `invited_user_id` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Invitation` table. All the data in the column will be lost.
  - The primary key for the `Task` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `frequency_type` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `group_id` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `task_id` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `weekday_mask` on the `Task` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_created_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `user_email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `user_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `user_password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `user_password_updated_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `TaskAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskCompletion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskEvaluation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,groupId]` on the table `GroupMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `GroupMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `GroupMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `GroupMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `Invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `Invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `Invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uid` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Group` DROP FOREIGN KEY `Group_owner_id_fkey`;

-- DropForeignKey
ALTER TABLE `GroupMember` DROP FOREIGN KEY `GroupMember_group_id_fkey`;

-- DropForeignKey
ALTER TABLE `GroupMember` DROP FOREIGN KEY `GroupMember_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Invitation` DROP FOREIGN KEY `Invitation_group_id_fkey`;

-- DropForeignKey
ALTER TABLE `Invitation` DROP FOREIGN KEY `Invitation_invited_by_fkey`;

-- DropForeignKey
ALTER TABLE `Invitation` DROP FOREIGN KEY `Invitation_invited_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_group_id_fkey`;

-- DropForeignKey
ALTER TABLE `TaskAssignment` DROP FOREIGN KEY `TaskAssignment_assigned_to_fkey`;

-- DropForeignKey
ALTER TABLE `TaskAssignment` DROP FOREIGN KEY `TaskAssignment_task_id_fkey`;

-- DropForeignKey
ALTER TABLE `TaskCompletion` DROP FOREIGN KEY `TaskCompletion_assignment_id_fkey`;

-- DropForeignKey
ALTER TABLE `TaskCompletion` DROP FOREIGN KEY `TaskCompletion_completed_by_fkey`;

-- DropForeignKey
ALTER TABLE `TaskEvaluation` DROP FOREIGN KEY `TaskEvaluation_assignment_id_fkey`;

-- DropForeignKey
ALTER TABLE `TaskEvaluation` DROP FOREIGN KEY `TaskEvaluation_evaluator_id_fkey`;

-- DropIndex
DROP INDEX `Group_owner_id_fkey` ON `Group`;

-- DropIndex
DROP INDEX `GroupMember_user_id_fkey` ON `GroupMember`;

-- DropIndex
DROP INDEX `Invitation_group_id_fkey` ON `Invitation`;

-- DropIndex
DROP INDEX `Invitation_invited_by_fkey` ON `Invitation`;

-- DropIndex
DROP INDEX `Invitation_invited_user_id_fkey` ON `Invitation`;

-- DropIndex
DROP INDEX `Task_group_id_fkey` ON `Task`;

-- DropIndex
DROP INDEX `User_user_email_key` ON `User`;

-- AlterTable
ALTER TABLE `Group` DROP PRIMARY KEY,
    DROP COLUMN `group_created_at`,
    DROP COLUMN `group_id`,
    DROP COLUMN `group_name`,
    DROP COLUMN `owner_id`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `ownerId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `GroupMember` DROP PRIMARY KEY,
    DROP COLUMN `group_id`,
    DROP COLUMN `joined_at`,
    DROP COLUMN `user_id`,
    ADD COLUMN `groupId` INTEGER NOT NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `userId` INTEGER NOT NULL,
    MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'member',
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Invitation` DROP PRIMARY KEY,
    DROP COLUMN `created_at`,
    DROP COLUMN `group_id`,
    DROP COLUMN `invitation_id`,
    DROP COLUMN `invited_by`,
    DROP COLUMN `invited_user_id`,
    DROP COLUMN `status`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `groupId` INTEGER NOT NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `token` VARCHAR(191) NOT NULL,
    ADD COLUMN `used` BOOLEAN NOT NULL DEFAULT false,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Task` DROP PRIMARY KEY,
    DROP COLUMN `created_at`,
    DROP COLUMN `difficulty`,
    DROP COLUMN `frequency_type`,
    DROP COLUMN `group_id`,
    DROP COLUMN `task_id`,
    DROP COLUMN `weekday_mask`,
    ADD COLUMN `assignedTo` INTEGER NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `dueDate` DATETIME(3) NULL,
    ADD COLUMN `groupId` INTEGER NOT NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `isDone` BOOLEAN NOT NULL DEFAULT false,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    DROP COLUMN `user_created_at`,
    DROP COLUMN `user_email`,
    DROP COLUMN `user_id`,
    DROP COLUMN `user_name`,
    DROP COLUMN `user_password`,
    DROP COLUMN `user_password_updated_at`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `uid` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `TaskAssignment`;

-- DropTable
DROP TABLE `TaskCompletion`;

-- DropTable
DROP TABLE `TaskEvaluation`;

-- CreateIndex
CREATE UNIQUE INDEX `GroupMember_userId_groupId_key` ON `GroupMember`(`userId`, `groupId`);

-- CreateIndex
CREATE UNIQUE INDEX `Invitation_token_key` ON `Invitation`(`token`);

-- CreateIndex
CREATE UNIQUE INDEX `User_uid_key` ON `User`(`uid`);

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_assignedTo_fkey` FOREIGN KEY (`assignedTo`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
