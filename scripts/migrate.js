"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const path_1 = require("path");
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
class MigrationRunner {
  constructor(connectionString, migrationsDir = "src/database/migrations") {
    this.pool = new Pool({ connectionString });
    this.migrationsDir = migrationsDir;
  }
  async init() {
    // Create migrations schema and table if they don't exist
    await this.pool.query(`
      CREATE SCHEMA IF NOT EXISTS migrations;
      CREATE TABLE IF NOT EXISTS migrations.applied_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  async getAppliedMigrations() {
    const result = await this.pool.query(
      "SELECT filename FROM migrations.applied_migrations ORDER BY id",
    );
    return result.rows.map((row) => row.filename);
  }
  async getMigrationFiles() {
    const files = await (0, promises_1.readdir)(this.migrationsDir);
    return files.filter((file) => file.endsWith(".sql")).sort(); // Assumes filename format like 0001_initial.sql
  }
  async runMigration(filename) {
    const filePath = (0, path_1.join)(this.migrationsDir, filename);
    const sql = await (0, promises_1.readFile)(filePath, "utf8");
    await this.pool.query("BEGIN");
    try {
      // Run the migration
      await this.pool.query(sql);
      // Record that it was applied
      await this.pool.query(
        "INSERT INTO migrations.applied_migrations (filename) VALUES ($1)",
        [filename],
      );
      await this.pool.query("COMMIT");
      console.log(`✅ Applied migration: ${filename}`);
    } catch (error) {
      await this.pool.query("ROLLBACK");
      throw error;
    }
  }
  async migrate() {
    await this.init();
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    const pendingMigrations = migrationFiles.filter(
      (file) => !appliedMigrations.includes(file),
    );
    if (pendingMigrations.length === 0) {
      console.log("🎉 No pending migrations");
      return;
    }
    console.log(`📦 Running ${pendingMigrations.length} pending migrations...`);
    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }
    console.log("🎉 All migrations completed successfully");
  }
  async close() {
    await this.pool.end();
  }
}
// Usage example
async function runMigrations() {
  const runner = new MigrationRunner(process.env.DATABASE_URL);
  try {
    await runner.migrate();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}
// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}
exports.default = MigrationRunner;
