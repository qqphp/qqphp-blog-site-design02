import { Client, type QueryResultRow } from 'pg';
import { env } from 'cloudflare:workers';

type DatabaseBindings = { DATABASE_URL?: string; HYPERDRIVE?: { connectionString: string } };

export async function withDatabase<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const bindings = env as unknown as DatabaseBindings;
  const connectionString = bindings.HYPERDRIVE?.connectionString || bindings.DATABASE_URL;
  if (!connectionString) throw new Error('未配置 PostgreSQL DATABASE_URL');
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

export async function queryOne<T extends QueryResultRow>(sql: string, values: unknown[] = []) {
  return withDatabase(async (client) => {
    const result = await client.query<T>(sql, values);
    return result.rows[0] ?? null;
  });
}
