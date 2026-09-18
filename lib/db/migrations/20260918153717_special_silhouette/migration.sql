CREATE TABLE "attestations" (
	"id" bigserial PRIMARY KEY,
	"subject_address" char(42) NOT NULL,
	"attester_address" char(42) NOT NULL,
	"role" varchar(32) NOT NULL,
	"relationship" varchar(64) NOT NULL,
	"duration_months" integer,
	"message" text NOT NULL,
	"signature" char(132) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attestations_identity" UNIQUE("attester_address","subject_address","role")
);
--> statement-breakpoint
CREATE INDEX "idx_attestations_subject" ON "attestations" ("subject_address","created_at");--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_subject_address_wallets_address_fkey" FOREIGN KEY ("subject_address") REFERENCES "wallets"("address");--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_attester_address_wallets_address_fkey" FOREIGN KEY ("attester_address") REFERENCES "wallets"("address");