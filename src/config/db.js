// src/config/db.js
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then(() => console.log("Supabase PostgreSQL 연결 성공!"))
  .catch((err) => console.error("DB 연결 실패:", err));
