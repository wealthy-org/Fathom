ALTER TABLE "disputes" ADD COLUMN "reporter_address" char(42) NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN "reason" text NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN "evidence" text NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reporter_target" UNIQUE("reporter_address","target_address");--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reporter_address_wallets_address_fkey" FOREIGN KEY ("reporter_address") REFERENCES "wallets"("address");