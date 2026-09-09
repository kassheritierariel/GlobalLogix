CREATE TABLE `agencyRegistrationRequests` (
	`id` varchar(64) NOT NULL,
	`requesterFirebaseUid` varchar(128) NOT NULL,
	`requesterEmail` varchar(320) NOT NULL,
	`requesterDisplayName` varchar(255),
	`agencyName` varchar(255) NOT NULL,
	`publicEmail` varchar(320) NOT NULL,
	`city` varchar(120) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedByFirebaseUid` varchar(128),
	`reviewerNote` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `agencyRegistrationRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agencyRegistrationRequests_status_created_idx` ON `agencyRegistrationRequests` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `agencyRegistrationRequests_requester_idx` ON `agencyRegistrationRequests` (`requesterFirebaseUid`,`createdAt`);