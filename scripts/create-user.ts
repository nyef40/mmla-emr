// scripts/create-user.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const [user] = await db.insert(schema.users).values({
      email: 'admin@mmla.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    }).returning();

    console.log('Test user created:', user.email);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();