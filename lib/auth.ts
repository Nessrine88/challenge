
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
      },
      country: {
        type: "string",
        required: false,
      },
    },
  },

  plugins: [admin()],
});
