CREATE TABLE "badge_attestations" (
	"badge_id" bigint NOT NULL,
	"attester_address" char(42) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badge_attestations_badge_id_attester_address_pk" PRIMARY KEY("badge_id","attester_address")
);
--> statement-breakpoint
CREATE TABLE "dispute_reports" (
	"dispute_id" bigint NOT NULL,
	"reporter_address" char(42) NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dispute_reports_dispute_id_reporter_address_pk" PRIMARY KEY("dispute_id","reporter_address")
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"target_address" char(42) NOT NULL,
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolution_note" text
);
--> statement-breakpoint
CREATE TABLE "indexer_state" (
	"contract_name" varchar(64) NOT NULL,
	"chain_id" integer NOT NULL,
	"last_block" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "indexer_state_contract_name_chain_id_pk" PRIMARY KEY("contract_name","chain_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"from_address" char(42) NOT NULL,
	"to_address" char(42) NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_pair" UNIQUE("from_address","to_address")
);
--> statement-breakpoint
CREATE TABLE "role_badges" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"address" char(42) NOT NULL,
	"role" varchar(32) NOT NULL,
	"status" varchar(16) DEFAULT 'unverified' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_badges_address_role" UNIQUE("address","role")
);
--> statement-breakpoint
CREATE TABLE "score_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"address" char(42) NOT NULL,
	"total_score" integer NOT NULL,
	"breakdown" jsonb NOT NULL,
	"trigger_event" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouches" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"tx_hash" char(66) NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" bigint NOT NULL,
	"from_address" char(42) NOT NULL,
	"to_address" char(42) NOT NULL,
	"stake_amount" numeric(78, 0) NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "vouches_tx_identity" UNIQUE("chain_id","tx_hash","log_index")
);
--> statement-breakpoint
CREATE TABLE "wallet_onchain_stats" (
	"address" char(42) PRIMARY KEY NOT NULL,
	"first_tx_at" timestamp with time zone,
	"tx_count" integer DEFAULT 0 NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"address" char(42) PRIMARY KEY NOT NULL,
	"alias" varchar(32),
	"invited_by" char(42),
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "badge_attestations" ADD CONSTRAINT "badge_attestations_badge_id_role_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."role_badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_attestations" ADD CONSTRAINT "badge_attestations_attester_address_wallets_address_fk" FOREIGN KEY ("attester_address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_reports" ADD CONSTRAINT "dispute_reports_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_reports" ADD CONSTRAINT "dispute_reports_reporter_address_wallets_address_fk" FOREIGN KEY ("reporter_address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_target_address_wallets_address_fk" FOREIGN KEY ("target_address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_from_address_wallets_address_fk" FOREIGN KEY ("from_address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_to_address_wallets_address_fk" FOREIGN KEY ("to_address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_badges" ADD CONSTRAINT "role_badges_address_wallets_address_fk" FOREIGN KEY ("address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_address_wallets_address_fk" FOREIGN KEY ("address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_from_address_wallets_address_fk" FOREIGN KEY ("from_address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_to_address_wallets_address_fk" FOREIGN KEY ("to_address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_onchain_stats" ADD CONSTRAINT "wallet_onchain_stats_address_wallets_address_fk" FOREIGN KEY ("address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_invited_by_wallets_address_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_disputes_target" ON "disputes" USING btree ("target_address","status");--> statement-breakpoint
CREATE INDEX "idx_reviews_to" ON "reviews" USING btree ("to_address");--> statement-breakpoint
CREATE INDEX "idx_snapshots_address_time" ON "score_snapshots" USING btree ("address","created_at");--> statement-breakpoint
CREATE INDEX "idx_vouches_to" ON "vouches" USING btree ("to_address","status");--> statement-breakpoint
CREATE INDEX "idx_vouches_pair" ON "vouches" USING btree ("from_address","to_address","created_at");--> statement-breakpoint
CREATE INDEX "idx_wallets_invited_by" ON "wallets" USING btree ("invited_by");