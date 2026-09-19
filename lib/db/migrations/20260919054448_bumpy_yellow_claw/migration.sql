CREATE TABLE "wallet_transactions" (
	"id" bigserial PRIMARY KEY,
	"subject_address" char(42) NOT NULL,
	"counterparty_address" char(42) NOT NULL,
	"transaction_hash" char(66) NOT NULL,
	"direction" varchar(12) NOT NULL,
	"value_wei" numeric(78,0) DEFAULT '0' NOT NULL,
	"to_is_contract" boolean DEFAULT false NOT NULL,
	"block_number" bigint,
	"timestamp" timestamp with time zone,
	"source" varchar(32),
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_transactions_subject_hash" UNIQUE("subject_address","transaction_hash")
);
--> statement-breakpoint
CREATE INDEX "idx_tx_subject" ON "wallet_transactions" ("subject_address","timestamp");--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_subject_address_counterparties_address_fkey" FOREIGN KEY ("subject_address") REFERENCES "counterparties"("address");--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_uRkkW37mH8Sf_fkey" FOREIGN KEY ("counterparty_address") REFERENCES "counterparties"("address");