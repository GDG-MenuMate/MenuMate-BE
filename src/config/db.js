// src/config/db.js
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool();

export { pool };
