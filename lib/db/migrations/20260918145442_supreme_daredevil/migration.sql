CREATE TABLE "counterparties" (
	"address" char(42) PRIMARY KEY,
	"is_contract" boolean DEFAULT false NOT NULL,
	"source" varchar(32),
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_relationships" (
	"id" bigserial PRIMARY KEY,
	"subject_address" char(42) NOT NULL,
	"counterparty_address" char(42) NOT NULL,
	"interaction_count" integer NOT NULL,
	"value_sent" numeric(78,0) DEFAULT '0' NOT NULL,
	"value_received" numeric(78,0) DEFAULT '0' NOT NULL,
	"first_interaction_at" timestamp with time zone,
	"last_interaction_at" timestamp with time zone,
	"source" varchar(32),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_relationships_pair" UNIQUE("subject_address","counterparty_address")
);
--> statement-breakpoint
CREATE INDEX "idx_relationships_subject" ON "wallet_relationships" ("subject_address","interaction_count");--> statement-breakpoint
ALTER TABLE "wallet_relationships" ADD CONSTRAINT "wallet_relationships_mB6J2Jfqrier_fkey" FOREIGN KEY ("subject_address") REFERENCES "counterparties"("address");--> statement-breakpoint
ALTER TABLE "wallet_relationships" ADD CONSTRAINT "wallet_relationships_VQAmQ7HaKUKz_fkey" FOREIGN KEY ("counterparty_address") REFERENCES "counterparties"("address");