CREATE TABLE `agencyProfiles` (
	`agencyId` varchar(128) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`legalName` varchar(255),
	`publicEmail` varchar(320),
	`publicPhone` varchar(32),
	`website` varchar(512),
	`logoUrl` varchar(1024),
	`primaryColor` varchar(7),
	`timeZone` varchar(64) NOT NULL DEFAULT 'Africa/Kinshasa',
	`supportHours` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agencyProfiles_agencyId` PRIMARY KEY(`agencyId`)
);
--> statement-breakpoint
CREATE TABLE `agencyWhatsAppConfigs` (
	`agencyId` varchar(128) NOT NULL,
	`metaAppId` varchar(128),
	`businessAccountId` varchar(128),
	`phoneNumberId` varchar(128),
	`senderPhoneLast4` varchar(4),
	`utilityTemplateName` varchar(255),
	`accessTokenCiphertext` text,
	`appSecretCiphertext` text,
	`verifyTokenCiphertext` text,
	`status` enum('draft','verified','active','disabled') NOT NULL DEFAULT 'draft',
	`lastValidatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agencyWhatsAppConfigs_agencyId` PRIMARY KEY(`agencyId`)
);
--> statement-breakpoint
CREATE TABLE `agencyWhatsAppMessageLogs` (
	`id` varchar(64) NOT NULL,
	`agencyId` varchar(128) NOT NULL,
	`shipmentId` varchar(64),
	`clientFirebaseUid` varchar(128),
	`recipientLast4` varchar(4),
	`direction` enum('outbound','inbound') NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`templateName` varchar(255),
	`providerMessageId` varchar(128),
	`status` enum('queued','sent','delivered','read','failed','received') NOT NULL,
	`sanitizedSummary` varchar(512),
	`errorCode` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`readAt` timestamp,
	CONSTRAINT `agencyWhatsAppMessageLogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `agencyWhatsAppMessageLogs_provider_message_unique` UNIQUE(`providerMessageId`)
);
--> statement-breakpoint
CREATE INDEX `agencyWhatsAppMessageLogs_agency_created_idx` ON `agencyWhatsAppMessageLogs` (`agencyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `agencyWhatsAppMessageLogs_shipment_idx` ON `agencyWhatsAppMessageLogs` (`shipmentId`);