CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'cancelled');--> statement-breakpoint
CREATE TABLE "challenge_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"inviter_id" text NOT NULL,
	"invitee_id" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "challenge_invitations" ADD CONSTRAINT "challenge_invitations_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_invitations" ADD CONSTRAINT "challenge_invitations_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_invitations" ADD CONSTRAINT "challenge_invitations_invitee_id_user_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenge_invitations_invitee_idx" ON "challenge_invitations" USING btree ("invitee_id","status");--> statement-breakpoint
CREATE INDEX "challenge_invitations_challenge_idx" ON "challenge_invitations" USING btree ("challenge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_invitations_pending_unique" ON "challenge_invitations" USING btree ("challenge_id","invitee_id") WHERE "challenge_invitations"."status" = 'pending';