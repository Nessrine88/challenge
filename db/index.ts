
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as authSchema from "./schema/auth-schema";
import * as challengeSchema from "./schema/challenge-schema";
import * as membershipSchema from "./schema/membership-schema";
import * as taskSchema from "./schema/task-schema";
import * as scheduleSchema from "./schema/schedule-schema";
import * as checkinSchema from "./schema/checkin-schema";

neonConfig.webSocketConstructor = ws;

const schema = {
  ...authSchema,
  ...challengeSchema,
  ...membershipSchema,
  ...taskSchema,
  ...scheduleSchema,
  ...checkinSchema,
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle({
  client: pool,
  schema,
});
