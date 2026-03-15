import { sql } from "drizzle-orm";
import { db } from "./src/db/index.js";

async function run() {
    try {
        console.log("Adding is_blacklisted column to users...");
        await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false;
    `);

        console.log("Creating settings table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

        console.log("Schema update completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Schema update failed:", error);
        process.exit(1);
    }
}

run();
