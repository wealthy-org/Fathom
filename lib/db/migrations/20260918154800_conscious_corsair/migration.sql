ALTER TABLE "disputes" ADD COLUMN "message" text NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN "signature" char(132) NOT NULL;