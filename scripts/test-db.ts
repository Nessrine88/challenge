import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`SELECT NOW() AS current_time`;

  console.log("Database connected successfully!");
  console.log(result);
}

main().catch(console.error);