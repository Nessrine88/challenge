CREATE TYPE "public"."schedule_frequency" AS ENUM('daily', 'selected_days');--> statement-breakpoint
CREATE TABLE "challenge_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"checkin_date" date NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"frequency" "schedule_frequency" DEFAULT 'daily' NOT NULL,
	"weekdays" smallint[] DEFAULT '{}' NOT NULL,
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_schedules_weekdays_check" CHECK ((
        ("challenge_schedules"."frequency" = 'daily' AND cardinality("challenge_schedules"."weekdays") = 0)
        OR
        (
          "challenge_schedules"."frequency" = 'selected_days'
          AND cardinality("challenge_schedules"."weekdays") BETWEEN 1 AND 7
          AND "challenge_schedules"."weekdays" <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
        )
      ))
);
--> statement-breakpoint
ALTER TABLE "challenge_checkins" ADD CONSTRAINT "challenge_checkins_membership_id_challenge_members_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."challenge_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_checkins" ADD CONSTRAINT "challenge_checkins_task_id_challenge_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."challenge_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_schedules" ADD CONSTRAINT "challenge_schedules_task_id_challenge_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."challenge_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_checkins_membership_task_date_unique" ON "challenge_checkins" USING btree ("membership_id","task_id","checkin_date");--> statement-breakpoint
CREATE INDEX "challenge_checkins_membership_date_idx" ON "challenge_checkins" USING btree ("membership_id","checkin_date");--> statement-breakpoint
CREATE INDEX "challenge_checkins_task_id_idx" ON "challenge_checkins" USING btree ("task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_schedules_task_id_unique" ON "challenge_schedules" USING btree ("task_id");