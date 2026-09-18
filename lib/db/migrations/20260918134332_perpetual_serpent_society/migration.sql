ALTER TABLE "wallet_onchain_stats" ADD COLUMN "last_tx_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "wallet_onchain_stats" ADD COLUMN "source" varchar(32);