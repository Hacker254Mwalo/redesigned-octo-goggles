CREATE TABLE `item_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerProfileId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`details` text NOT NULL,
	`budgetHint` decimal(12,2),
	`preferredFulfilment` enum('siaya_pickup','home_delivery','collection_point','special_order') NOT NULL DEFAULT 'siaya_pickup',
	`preferredLocation` varchar(180),
	`status` enum('submitted','reviewing','quoted','accepted','sourcing','completed','unavailable','cancelled') NOT NULL DEFAULT 'submitted',
	`sourceRoute` enum('mtaa_select','approved_vendor','supplier','external_marketplace','other'),
	`quotedPrice` decimal(12,2),
	`platformReply` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `item_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `fulfilmentMethod` enum('siaya_pickup','home_delivery','collection_point','special_order') DEFAULT 'siaya_pickup' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `customerFulfilmentNote` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryArea` varchar(180);--> statement-breakpoint
ALTER TABLE `orders` ADD `buyerContactShared` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentTimingSnapshot` enum('pay_before','pay_on_collection','pay_on_delivery','confirm_with_mtaamarket') DEFAULT 'confirm_with_mtaamarket' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `platformNotes` text;--> statement-breakpoint
ALTER TABLE `products` ADD `sourceType` enum('mtaa_select','approved_seller','special_order') DEFAULT 'approved_seller' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `itemCondition` enum('new','used','refurbished') DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `availabilityStatus` enum('ready','seller_confirmed','special_order') DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `paymentTiming` enum('pay_before','pay_on_collection','pay_on_delivery','confirm_with_mtaamarket') DEFAULT 'confirm_with_mtaamarket' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `fulfilmentOptions` json;--> statement-breakpoint
ALTER TABLE `products` ADD `moderationStatus` enum('visible','paused','removed') DEFAULT 'visible' NOT NULL;--> statement-breakpoint
ALTER TABLE `vendors` ADD `serviceArea` varchar(240) DEFAULT 'Serves Siaya County' NOT NULL;--> statement-breakpoint
ALTER TABLE `vendors` ADD `approvalStatus` enum('pending','approved','suspended','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `vendors` ADD `ownerNotes` text;--> statement-breakpoint
ALTER TABLE `vendors` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `vendors` ADD `suspendedAt` timestamp;--> statement-breakpoint
ALTER TABLE `item_requests` ADD CONSTRAINT `item_requests_buyerProfileId_marketplace_profiles_id_fk` FOREIGN KEY (`buyerProfileId`) REFERENCES `marketplace_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `item_requests_buyer_status_index` ON `item_requests` (`buyerProfileId`,`status`,`createdAt`);