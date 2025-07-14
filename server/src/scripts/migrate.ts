import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import pg from 'pg';

const { Pool } = pg;

interface MigrationRow {
  filename: string;
}

interface QueryResult {
  rows: MigrationRow[];
}

class MigrationRunner {
  private pool: pg.Pool;
  private migrationsDir: string;

  constructor(connectionString: string, migrationsDir: string = 'src/database/migrations') {
    this.pool = new Pool({ connectionString });
    this.migrationsDir = migrationsDir;
  }

  async init(): Promise<void> {
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

  async getAppliedMigrations(): Promise<string[]> {
    const result: QueryResult = await this.pool.query(
      'SELECT filename FROM migrations.applied_migrations ORDER BY id'
    );
    return result.rows.map(row => row.filename);
  }

  async getMigrationFiles(): Promise<string[]> {
    const files = await readdir(this.migrationsDir);
    return files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Assumes filename format like 0001_initial.sql
  }

  async runMigration(filename: string): Promise<void> {
    const filePath = join(this.migrationsDir, filename);
    const sql = await readFile(filePath, 'utf8');
    
    await this.pool.query('BEGIN');
    try {
      // Run the migration
      await this.pool.query(sql);
      
      // Record that it was applied
      await this.pool.query(
        'INSERT INTO migrations.applied_migrations (filename) VALUES ($1)',
        [filename]
      );
      
      await this.pool.query('COMMIT');
      console.log(`✅ Applied migration: ${filename}`);
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }
  }

  async migrate(): Promise<void> {
    await this.init();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('🎉 No pending migrations');
      return;
    }

    console.log(`📦 Running ${pendingMigrations.length} pending migrations...`);
    
    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }
    
    console.log('🎉 All migrations completed successfully');
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Usage example
async function runMigrations(): Promise<void> {
  const runner = new MigrationRunner(process.env.DATABASE_URL as string);
  
  try {
    await runner.migrate();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export default MigrationRunner;