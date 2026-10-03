CREATE TABLE `mobilePushTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firebaseUid` varchar(128) NOT NULL,
	`agencyId` varchar(128),
	`token` varchar(255) NOT NULL,
	`platform` enum('ios','android') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mobilePushTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobilePushTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE INDEX `mobilePushTokens_agency_idx` ON `mobilePushTokens` (`agencyId`);--> statement-breakpoint
CREATE INDEX `mobilePushTokens_uid_idx` ON `mobilePushTokens` (`firebaseUid`);