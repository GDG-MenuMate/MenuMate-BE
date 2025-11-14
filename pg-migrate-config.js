// pg-migrate-config.js

require("dotenv").config({ path: "./.env" });

const { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

module.exports = {
  databaseUrl: `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`,

  dir: "migrations",

  migrationsTable: "pgmigrations",

  // SSL 비활성화 (로컬 개발용)
  ssl: false,
};
