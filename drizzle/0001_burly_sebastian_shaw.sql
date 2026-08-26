CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cartId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `cart_items_cart_product_unique` UNIQUE(`cartId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carts_id` PRIMARY KEY(`id`),
	CONSTRAINT `carts_profile_unique` UNIQUE(`profileId`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`slug` varchar(96) NOT NULL,
	`icon` varchar(48) NOT NULL,
	`description` varchar(240),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`openedByProfileId` int NOT NULL,
	`reason` varchar(120) NOT NULL,
	`details` text NOT NULL,
	`status` enum('open','under_review','resolved_buyer','resolved_vendor','closed') NOT NULL DEFAULT 'open',
	`resolution` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`),
	CONSTRAINT `disputes_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`phoneNumber` varchar(20),
	`role` enum('buyer','vendor','admin') NOT NULL DEFAULT 'buyer',
	`avatarUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplace_profiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `marketplace_profiles_phone_unique` UNIQUE(`phoneNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`type` enum('payment','pickup','delivery','dispute','order','system') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`orderId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`actorProfileId` int,
	`eventType` varchar(80) NOT NULL,
	`fromStatus` varchar(48),
	`toStatus` varchar(48),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int,
	`vendorId` int,
	`titleSnapshot` varchar(180) NOT NULL,
	`imageUrlSnapshot` text,
	`unitPrice` decimal(12,2) NOT NULL,
	`quantity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`buyerProfileId` int NOT NULL,
	`vendorId` int,
	`pickupStationId` int,
	`subtotal` decimal(12,2) NOT NULL,
	`pickupFee` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalAmount` decimal(12,2) NOT NULL,
	`paymentStatus` enum('unpaid','initiated','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
	`status` enum('pending_payment','paid_escrow','ready_for_pickup','picked_up','released_vendor','disputed','cancelled') NOT NULL DEFAULT 'pending_payment',
	`mpesaCheckoutRequestId` varchar(128),
	`mpesaMerchantRequestId` varchar(128),
	`mpesaReceiptNumber` varchar(64),
	`paymentPhone` varchar(20),
	`autoReleaseAt` timestamp,
	`pickedUpAt` timestamp,
	`releasedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`),
	CONSTRAINT `orders_checkout_request_unique` UNIQUE(`mpesaCheckoutRequestId`)
);
--> statement-breakpoint
CREATE TABLE `pickup_stations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(140) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`county` varchar(80) NOT NULL,
	`town` varchar(80) NOT NULL,
	`address` text NOT NULL,
	`landmark` varchar(180),
	`openingHours` varchar(180),
	`contactPhone` varchar(20),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pickup_stations_id` PRIMARY KEY(`id`),
	CONSTRAINT `pickup_stations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int,
	`categoryId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`description` text NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`compareAtPrice` decimal(12,2),
	`stockQuantity` int NOT NULL DEFAULT 0,
	`imageUrl` text,
	`imageKey` varchar(512),
	`imageAlt` varchar(180),
	`isLocalInventory` boolean NOT NULL DEFAULT false,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`buyerProfileId` int NOT NULL,
	`orderItemId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_orderItemId_unique` UNIQUE(`orderItemId`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`storeName` varchar(120) NOT NULL,
	`storeSlug` varchar(140) NOT NULL,
	`description` text,
	`supportPhone` varchar(20),
	`logoUrl` text,
	`pickupNotes` text,
	`isVerified` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`),
	CONSTRAINT `vendors_profileId_unique` UNIQUE(`profileId`),
	CONSTRAINT `vendors_storeSlug_unique` UNIQUE(`storeSlug`)
);
--> statement-breakpoint
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_cartId_carts_id_fk` FOREIGN KEY (`cartId`) REFERENCES `carts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carts` ADD CONSTRAINT `carts_profileId_marketplace_profiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `marketplace_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_openedByProfileId_marketplace_profiles_id_fk` FOREIGN KEY (`openedByProfileId`) REFERENCES `marketplace_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_profiles` ADD CONSTRAINT `marketplace_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_profileId_marketplace_profiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `marketplace_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_events` ADD CONSTRAINT `order_events_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_events` ADD CONSTRAINT `order_events_actorProfileId_marketplace_profiles_id_fk` FOREIGN KEY (`actorProfileId`) REFERENCES `marketplace_profiles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_buyerProfileId_marketplace_profiles_id_fk` FOREIGN KEY (`buyerProfileId`) REFERENCES `marketplace_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_pickupStationId_pickup_stations_id_fk` FOREIGN KEY (`pickupStationId`) REFERENCES `pickup_stations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_buyerProfileId_marketplace_profiles_id_fk` FOREIGN KEY (`buyerProfileId`) REFERENCES `marketplace_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_orderItemId_order_items_id_fk` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_profileId_marketplace_profiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `marketplace_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notifications_profile_index` ON `notifications` (`profileId`,`isRead`,`createdAt`);--> statement-breakpoint
CREATE INDEX `order_events_order_index` ON `order_events` (`orderId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `order_items_order_index` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `orders_buyer_status_index` ON `orders` (`buyerProfileId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `orders_vendor_status_index` ON `orders` (`vendorId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `pickup_stations_location_index` ON `pickup_stations` (`county`,`town`,`isActive`);--> statement-breakpoint
CREATE INDEX `products_discovery_index` ON `products` (`status`,`categoryId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `products_vendor_index` ON `products` (`vendorId`,`status`);--> statement-breakpoint
CREATE INDEX `reviews_product_index` ON `reviews` (`productId`,`createdAt`);