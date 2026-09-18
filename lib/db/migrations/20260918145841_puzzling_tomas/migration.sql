CREATE TABLE "trust_graph_state" (
	"subject_address" char(42) PRIMARY KEY,
	"complete" boolean NOT NULL,
	"source" varchar(32),
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trust_graph_state" ADD CONSTRAINT "trust_graph_state_subject_address_counterparties_address_fkey" FOREIGN KEY ("subject_address") REFERENCES "counterparties"("address");