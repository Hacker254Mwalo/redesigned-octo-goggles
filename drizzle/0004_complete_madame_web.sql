CREATE TABLE `assisted_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assistedOrderNumber` varchar(36) NOT NULL,
	`itemRequestId` int,
	`ownerProfileId` int NOT NULL,
	`vendorId` int,
	`customerName` varchar(120) NOT NULL,
	`customerPhone` varchar(20),
	`title` varchar(180) NOT NULL,
	`details` text NOT NULL,
	`quotedAmount` decimal(12,2),
	`paymentTiming` enum('pay_before','pay_on_collection','pay_on_delivery','confirm_with_mtaamarket') NOT NULL DEFAULT 'confirm_with_mtaamarket',
	`fulfilmentMethod` enum('siaya_pickup','home_delivery','collection_point','special_order') NOT NULL DEFAULT 'siaya_pickup',
	`preferredLocation` varchar(180),
	`sourceRoute` enum('mtaa_select','approved_vendor','supplier','external_marketplace','other') NOT NULL DEFAULT 'other',
	`status` enum('recorded','confirmed','sourcing','ready','out_for_delivery','completed','cancelled') NOT NULL DEFAULT 'recorded',
	`platformNotes` text,
	`confirmedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assisted_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `assisted_orders_assistedOrderNumber_unique` UNIQUE(`assistedOrderNumber`)
);
--> statement-breakpoint
ALTER TABLE `assisted_orders` ADD CONSTRAINT `assisted_orders_itemRequestId_item_requests_id_fk` FOREIGN KEY (`itemRequestId`) REFERENCES `item_requests`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assisted_orders` ADD CONSTRAINT `assisted_orders_ownerProfileId_marketplace_profiles_id_fk` FOREIGN KEY (`ownerProfileId`) REFERENCES `marketplace_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assisted_orders` ADD CONSTRAINT `assisted_orders_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `assisted_orders_status_index` ON `assisted_orders` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assisted_orders_owner_index` ON `assisted_orders` (`ownerProfileId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assisted_orders_request_index` ON `assisted_orders` (`itemRequestId`);