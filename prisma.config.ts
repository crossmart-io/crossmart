import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'libs/database/prisma/schema.prisma',
  migrations: {
    path: 'libs/database/prisma/migrations',
  },
  datasource: {
    // Optional here so `prisma generate` works without a database (e.g. Docker builds);
    // commands that connect (migrate, studio) fail clearly when it is missing.
    url: process.env.DATABASE_URL ?? '',
  },
});
