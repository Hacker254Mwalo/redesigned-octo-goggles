ALTER TABLE `item_requests` MODIFY COLUMN `buyerProfileId` int;--> statement-breakpoint
ALTER TABLE `item_requests` ADD `createdByProfileId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `item_requests` ADD `isAssisted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `item_requests` ADD `customerName` varchar(120);--> statement-breakpoint
ALTER TABLE `item_requests` ADD `customerPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `item_requests` ADD CONSTRAINT `item_requests_createdByProfileId_marketplace_profiles_id_fk` FOREIGN KEY (`createdByProfileId`) REFERENCES `marketplace_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `item_requests_assisted_status_index` ON `item_requests` (`isAssisted`,`status`,`createdAt`);