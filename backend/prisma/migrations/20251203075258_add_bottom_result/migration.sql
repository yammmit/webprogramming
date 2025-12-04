/*
  Warnings:

  - Added the required column `bottom_result` to the `LadderResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `LadderResult` ADD COLUMN `bottom_result` JSON NULL;

-- Backfill existing rows with an empty array (or adjust to a sensible default)
UPDATE `LadderResult` SET `bottom_result` = JSON_ARRAY() WHERE `bottom_result` IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE `LadderResult` MODIFY COLUMN `bottom_result` JSON NOT NULL;
