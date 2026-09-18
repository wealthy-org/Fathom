ALTER TABLE "wallet_onchain_stats" ALTER COLUMN "tx_count" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "wallet_onchain_stats" ALTER COLUMN "tx_count" DROP NOT NULL;