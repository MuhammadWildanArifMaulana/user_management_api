import fs from "fs";
import path from "path";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const sqlPath = path.resolve(
  process.cwd(),
  "migrations",
  "create_users_table.sql"
);
const sql = fs.readFileSync(sqlPath, { encoding: "utf8" });

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set in environment");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to DB, running migration...");
    await client.query(sql);
    console.log("Migration applied.");
  } catch (err) {
    console.error("Migration failed:", err.stack || err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
