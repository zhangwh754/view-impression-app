import "server-only";

import "@/infrastructure/http/proxy";
import {
  neon,
  type NeonQueryFunction,
} from "@neondatabase/serverless";

type Database = NeonQueryFunction<false, false>;

let database: Database | null = null;

/** 返回惰性创建的 Neon HTTP 查询客户端，避免模块导入时读取构建环境。 */
export function getDatabase(): Database {
  if (database) return database;

  const connectionString =
    process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing POSTGRES_URL or DATABASE_URL env var");
  }

  database = neon(connectionString);
  return database;
}
