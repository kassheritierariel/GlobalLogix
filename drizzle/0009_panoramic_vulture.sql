ALTER TABLE `agencyProfiles` ADD `customDomain` varchar(253);--> statement-breakpoint
ALTER TABLE `agencyProfiles` ADD `customDomain` varchar(253);--> statement-breakpoint
ALTER TABLE `agencyProfiles` ADD `customDomainStatus` enum('not_configured','pending_dns','verified','disabled') DEFAULT 'not_configured' NOT NULL;--> statement-breakpoint
ALTER TABLE `agencyProfiles` ADD `customDomainRequestedAt` timestamp;--> statement-breakpoint
ALTER TABLE `agencyProfiles` ADD CONSTRAINT `agencyProfiles_custom_domain_unique` UNIQUE(`customDomain`);
