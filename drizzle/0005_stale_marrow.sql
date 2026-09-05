ALTER TABLE `saasTransactions` ADD `planId` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `saasTransactions` ADD `planId` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `saasTransactions` ADD `billingCycle` enum('monthly','annual') NOT NULL;
