CREATE TABLE `exceptionCases` (
	`id` varchar(64) NOT NULL,
	`shipmentId` varchar(64) NOT NULL,
	`agencyId` varchar(128) NOT NULL,
	`kind` enum('delay','customs','no_signal','eta_risk','temperature') NOT NULL,
	`severity` enum('warning','critical') NOT NULL,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`slaDueAt` timestamp,
	`assignedTo` varchar(128),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exceptionCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipmentEvents` (
	`id` varchar(64) NOT NULL,
	`shipmentId` varchar(64) NOT NULL,
	`agencyId` varchar(128) NOT NULL,
	`eventId` varchar(128) NOT NULL,
	`type` enum('location_update','status_changed','eta_changed','customs_hold','delay_detected','note') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`source` varchar(64) NOT NULL,
	`confidence` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`sequence` bigint NOT NULL,
	`message` text NOT NULL,
	`payload` text,
	`occurredAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipmentEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipmentEvents_event_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `shipmentShareLinks` (
	`id` varchar(64) NOT NULL,
	`shipmentId` varchar(64) NOT NULL,
	`agencyId` varchar(128) NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdBy` varchar(128) NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipmentShareLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipmentShareLinks_token_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` varchar(64) NOT NULL,
	`agencyId` varchar(128) NOT NULL,
	`trackingNumber` varchar(128) NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320),
	`origin` varchar(255) NOT NULL,
	`destination` varchar(255) NOT NULL,
	`mode` enum('air','sea','land','rail') NOT NULL,
	`status` enum('planned','in_transit','customs','delayed','delivered','cancelled') NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`distanceRemainingKm` int,
	`eta` timestamp,
	`currentPosition` varchar(255),
	`source` varchar(64) NOT NULL DEFAULT 'manual',
	`confidence` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`sequence` bigint NOT NULL DEFAULT 0,
	`lastTelemetryAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipments_tracking_unique` UNIQUE(`trackingNumber`)
);
--> statement-breakpoint
CREATE INDEX `exceptionCases_agency_status_idx` ON `exceptionCases` (`agencyId`,`status`);--> statement-breakpoint
CREATE INDEX `exceptionCases_shipment_idx` ON `exceptionCases` (`shipmentId`);--> statement-breakpoint
CREATE INDEX `shipmentEvents_shipment_sequence_idx` ON `shipmentEvents` (`shipmentId`,`sequence`);--> statement-breakpoint
CREATE INDEX `shipmentEvents_agency_occurred_idx` ON `shipmentEvents` (`agencyId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `shipmentShareLinks_shipment_idx` ON `shipmentShareLinks` (`shipmentId`);--> statement-breakpoint
CREATE INDEX `shipmentShareLinks_expiry_idx` ON `shipmentShareLinks` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `shipments_agency_idx` ON `shipments` (`agencyId`);--> statement-breakpoint
CREATE INDEX `shipments_agency_status_idx` ON `shipments` (`agencyId`,`status`);