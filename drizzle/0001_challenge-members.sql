CREATE TYPE "public"."challenge_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."challenge_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" text NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50),
	"visibility" "challenge_visibility" DEFAULT 'public' NOT NULL,
	"status" "challenge_status" DEFAULT 'draft' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"max_participants" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenges_end_date_check" CHECK ("challenges"."end_date" IS NULL OR "challenges"."end_date" >= "challenges"."start_date"),
	CONSTRAINT "challenges_max_participants_check" CHECK ("challenges"."max_participants" IS NULL OR "challenges"."max_participants" > 0)
);
--> statement-breakpoint
CREATE TABLE "challenge_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_members" ADD CONSTRAINT "challenge_members_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_members" ADD CONSTRAINT "challenge_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenges_creator_id_idx" ON "challenges" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "challenges_visibility_status_idx" ON "challenges" USING btree ("visibility","status");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_members_challenge_user_unique" ON "challenge_members" USING btree ("challenge_id","user_id");--> statement-breakpoint
CREATE INDEX "challenge_members_user_id_idx" ON "challenge_members" USING btree ("user_id");