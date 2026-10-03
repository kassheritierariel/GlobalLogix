ALTER TABLE `agencyProfiles` ADD `publicSlug` varchar(80) NULL;--> statement-breakpoint
UPDATE `agencyProfiles` SET `publicSlug` = LOWER(REPLACE(`agencyId`, '_', '-')) WHERE `publicSlug` IS NULL;--> statement-breakpoint
ALTER TABLE `agencyProfiles` MODIFY `publicSlug` varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE `agencyProfiles` ADD CONSTRAINT `agencyProfiles_public_slug_unique` UNIQUE(`publicSlug`);
