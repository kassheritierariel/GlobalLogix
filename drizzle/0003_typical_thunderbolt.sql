CREATE TABLE `clientAccounts` (
	`firebaseUid` varchar(128) NOT NULL,
	`whatsAppNumber` varchar(16) NOT NULL,
	`displayName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientAccounts_firebaseUid` PRIMARY KEY(`firebaseUid`),
	CONSTRAINT `clientAccounts_whatsapp_unique` UNIQUE(`whatsAppNumber`)
);
--> statement-breakpoint
CREATE TABLE `clientShipmentLinks` (
	`id` varchar(64) NOT NULL,
	`firebaseUid` varchar(128) NOT NULL,
	`shipmentId` varchar(64) NOT NULL,
	`agencyId` varchar(128) NOT NULL,
	`linkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clientShipmentLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientShipmentLinks_client_shipment_unique` UNIQUE(`firebaseUid`,`shipmentId`),
	CONSTRAINT `clientShipmentLinks_shipment_owner_unique` UNIQUE(`shipmentId`)
);
--> statement-breakpoint
ALTER TABLE `shipments` ADD `customerPhone` varchar(16);--> statement-breakpoint
CREATE INDEX `clientShipmentLinks_client_idx` ON `clientShipmentLinks` (`firebaseUid`);