CREATE TABLE `accountDeletionRequests` (
	`id` varchar(64) NOT NULL,
	`firebaseUid` varchar(128) NOT NULL,
	`requesterEmail` varchar(320),
	`requesterRole` varchar(32) NOT NULL,
	`status` enum('pending','completed','rejected') NOT NULL DEFAULT 'pending',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `accountDeletionRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `accountDeletionRequests_uid_status_idx` ON `accountDeletionRequests` (`firebaseUid`,`status`);--> statement-breakpoint
CREATE INDEX `accountDeletionRequests_status_requested_idx` ON `accountDeletionRequests` (`status`,`requestedAt`);