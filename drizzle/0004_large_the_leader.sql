CREATE TABLE `agencySubscriptions` (
	`id` varchar(64) NOT NULL,
	`agencyId` varchar(128) NOT NULL,
	`planId` varchar(32) NOT NULL,
	`billingCycle` enum('monthly','annual') NOT NULL,
	`status` enum('trial','pending_payment','active','past_due','cancelled','expired') NOT NULL DEFAULT 'pending_payment',
	`chariowProductId` varchar(128),
	`chariowSaleId` varchar(128),
	`shipmentLimit` int,
	`teamMemberLimit` int,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`renewsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agencySubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `agencySubscriptions_agency_unique` UNIQUE(`agencyId`),
	CONSTRAINT `agencySubscriptions_chariow_sale_unique` UNIQUE(`chariowSaleId`)
);
--> statement-breakpoint
CREATE TABLE `saasTransactions` (
	`id` varchar(64) NOT NULL,
	`agencyId` varchar(128) NOT NULL,
	`subscriptionId` varchar(64) NOT NULL,
	`provider` enum('chariow') NOT NULL DEFAULT 'chariow',
	`providerSaleId` varchar(128),
	`providerTransactionId` varchar(128),
	`providerEventId` varchar(128),
	`status` enum('created','awaiting_payment','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'created',
	`productId` varchar(128) NOT NULL,
	`currency` varchar(8),
	`amountMinor` int,
	`errorCode` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saasTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `saasTransactions_provider_sale_unique` UNIQUE(`providerSaleId`),
	CONSTRAINT `saasTransactions_provider_event_unique` UNIQUE(`providerEventId`)
);
--> statement-breakpoint
CREATE INDEX `agencySubscriptions_status_idx` ON `agencySubscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `saasTransactions_agency_idx` ON `saasTransactions` (`agencyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `saasTransactions_subscription_idx` ON `saasTransactions` (`subscriptionId`);